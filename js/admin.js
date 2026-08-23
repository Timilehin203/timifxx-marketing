const API_BASE_URL =
  window.TIMIFXX_API_BASE_URL ||
  document
    .querySelector(
      'meta[name="api-base-url"]'
    )
    ?.content ||
  '';


function apiUrl(
  path
) {

  return `${
    API_BASE_URL.replace(
      /\/$/,
      ''
    )
  }${path}`;

}


/*
|--------------------------------------------------------------------------
| ELEMENTS
|--------------------------------------------------------------------------
*/

const loginScreen =
  document.getElementById(
    'loginScreen'
  );


const dashboard =
  document.getElementById(
    'dashboard'
  );


const loginForm =
  document.getElementById(
    'loginForm'
  );


const adminKeyInput =
  document.getElementById(
    'adminKey'
  );


const loginMessage =
  document.getElementById(
    'loginMessage'
  );


const ordersContainer =
  document.getElementById(
    'ordersContainer'
  );


const ordersMessage =
  document.getElementById(
    'ordersMessage'
  );


const refreshButton =
  document.getElementById(
    'refreshButton'
  );


const logoutButton =
  document.getElementById(
    'logoutButton'
  );


const statusFilter =
  document.getElementById(
    'statusFilter'
  );


const totalOrders =
  document.getElementById(
    'totalOrders'
  );


const pendingOrders =
  document.getElementById(
    'pendingOrders'
  );


const progressOrders =
  document.getElementById(
    'progressOrders'
  );


const completedOrders =
  document.getElementById(
    'completedOrders'
  );


/*
|--------------------------------------------------------------------------
| ADMIN KEY STORAGE
|--------------------------------------------------------------------------
*/

const ADMIN_KEY_STORAGE =
  'timifxx_admin_key';


function getAdminKey() {

  return sessionStorage.getItem(
    ADMIN_KEY_STORAGE
  );

}


function setAdminKey(
  key
) {

  sessionStorage.setItem(
    ADMIN_KEY_STORAGE,
    key
  );

}


function clearAdminKey() {

  sessionStorage.removeItem(
    ADMIN_KEY_STORAGE
  );

}


/*
|--------------------------------------------------------------------------
| HTML ESCAPING
|--------------------------------------------------------------------------
*/

function escapeHtml(
  value
) {

  return String(
    value ?? ''
  )
    .replaceAll(
      '&',
      '&amp;'
    )
    .replaceAll(
      '<',
      '&lt;'
    )
    .replaceAll(
      '>',
      '&gt;'
    )
    .replaceAll(
      '"',
      '&quot;'
    )
    .replaceAll(
      "'",
      '&#039;'
    );

}


/*
|--------------------------------------------------------------------------
| FORMAT STATUS
|--------------------------------------------------------------------------
*/

function formatStatus(
  status
) {

  return String(
    status
  )
    .replaceAll(
      '_',
      ' '
    )
    .replace(
      /\b\w/g,
      character =>
        character.toUpperCase()
    );

}


/*
|--------------------------------------------------------------------------
| ADMIN REQUEST
|--------------------------------------------------------------------------
*/

async function adminFetch(
  path,
  options = {}
) {

  const adminKey =
    getAdminKey();


  const response =
    await fetch(
      apiUrl(path),
      {

        ...options,

        headers: {

          Accept:
            'application/json',

          Authorization:
            `Bearer ${adminKey}`,

          ...(options.body
            ? {
                'Content-Type':
                  'application/json'
              }
            : {}),

          ...(
            options.headers || {}
          )

        }

      }
    );


  const data =
    await response
      .json()
      .catch(
        () => ({})
      );


  if (!response.ok) {

    const error =
      new Error(
        data.message ||
        'Request failed.'
      );


    error.status =
      response.status;


    throw error;

  }


  return data;

}


/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
*/

if (loginForm) {

  loginForm.addEventListener(
    'submit',
    async event => {

      event.preventDefault();


      const key =
        adminKeyInput.value
          .trim();


      if (!key) {

        loginMessage.textContent =
          'Enter your admin access key.';

        return;

      }


      loginMessage.textContent =
        'Checking access...';


      setAdminKey(
        key
      );


      try {

        await loadOrders();


        showDashboard();

      } catch (error) {

        clearAdminKey();


        loginMessage.textContent =
          error.status === 401
            ? 'Invalid admin access key.'
            : 'Unable to connect to the admin system.';

      }

    }
  );

}


/*
|--------------------------------------------------------------------------
| SHOW DASHBOARD
|--------------------------------------------------------------------------
*/

function showDashboard() {

  loginScreen.hidden =
    true;


  dashboard.hidden =
    false;

}


/*
|--------------------------------------------------------------------------
| SHOW LOGIN
|--------------------------------------------------------------------------
*/

function showLogin() {

  dashboard.hidden =
    true;


  loginScreen.hidden =
    false;


  adminKeyInput.value =
    '';

}


/*
|--------------------------------------------------------------------------
| LOAD ORDERS
|--------------------------------------------------------------------------
*/

async function loadOrders() {

  if (!ordersContainer) {
    return;
  }


  ordersMessage.textContent =
    '';


  ordersContainer.innerHTML =
    `
      <div class="orders-loading">
        Loading orders...
      </div>
    `;


  try {

    const data =
      await adminFetch(
        '/api/admin/orders'
      );


    const orders =
      Array.isArray(
        data.orders
      )
        ? data.orders
        : [];


    updateSummary(
      orders
    );


    renderOrders(
      orders
    );


    ordersMessage.textContent =
      `${orders.length} order${
        orders.length === 1
          ? ''
          : 's'
      } loaded.`;

  } catch (error) {

    console.error(
      'Order loading error:',
      error
    );


    if (
      error.status === 401
    ) {

      clearAdminKey();

      showLogin();

      loginMessage.textContent =
        'Your session has expired. Please login again.';

      return;

    }


    ordersContainer.innerHTML =
      `
        <div class="orders-loading">
          Unable to load orders.
        </div>
      `;


    ordersMessage.textContent =
      error.message;

    throw error;

  }

}


/*
|--------------------------------------------------------------------------
| UPDATE SUMMARY
|--------------------------------------------------------------------------
*/

function updateSummary(
  orders
) {

  totalOrders.textContent =
    orders.length;


  pendingOrders.textContent =
    orders.filter(
      order =>
        order.status === 'pending'
    ).length;


  progressOrders.textContent =
    orders.filter(
      order =>
        order.status === 'in_progress'
    ).length;


  completedOrders.textContent =
    orders.filter(
      order =>
        order.status === 'completed'
    ).length;

}


/*
|--------------------------------------------------------------------------
| RENDER ORDERS
|--------------------------------------------------------------------------
*/

function renderOrders(
  orders
) {

  const filter =
    statusFilter.value;


  const filteredOrders =
    filter
      ? orders.filter(
          order =>
            order.status === filter
        )
      : orders;


  if (
    filteredOrders.length === 0
  ) {

    ordersContainer.innerHTML =
      `
        <div class="orders-loading">
          No orders found.
        </div>
      `;

    return;

  }


  ordersContainer.innerHTML =
    filteredOrders
      .map(
        order => {

          const createdDate =
            new Date(
              order.created_at
            ).toLocaleString();


          const message =
            order.message
              ? escapeHtml(
                  order.message
                )
              : 'No additional details provided.';


          return `

            <article
              class="admin-order-card"
            >

              <div
                class="order-card-top"
              >

                <div>

                  <span
                    class="order-number"
                  >
                    ${escapeHtml(
                      order.order_number
                    )}
                  </span>

                  <h3>
                    ${escapeHtml(
                      order.service_name
                    )}
                  </h3>

                </div>


                <span
                  class="status-badge status-${escapeHtml(
                    order.status
                  )}"
                >
                  ${escapeHtml(
                    formatStatus(
                      order.status
                    )
                  )}
                </span>

              </div>


              <div
                class="order-info-grid"
              >

                <div>

                  <span>
                    Customer
                  </span>

                  <strong>
                    ${escapeHtml(
                      order.customer_name
                    )}
                  </strong>

                </div>


                <div>

                  <span>
                    Email
                  </span>

                  <strong>
                    ${escapeHtml(
                      order.customer_email
                    )}
                  </strong>

                </div>


                <div>

                  <span>
                    Telegram
                  </span>

                  <strong>
                    ${escapeHtml(
                      order.telegram_username ||
                      'Not provided'
                    )}
                  </strong>

                </div>


                <div>

                  <span>
                    WhatsApp
                  </span>

                  <strong>
                    ${escapeHtml(
                      order.whatsapp ||
                      'Not provided'
                    )}
                  </strong>

                </div>


                <div>

                  <span>
                    Price
                  </span>

                  <strong>
                    $${Number(
                      order.price
                    ).toFixed(2)}
                  </strong>

                </div>


                <div>

                  <span>
                    Created
                  </span>

                  <strong>
                    ${escapeHtml(
                      createdDate
                    )}
                  </strong>

                </div>

              </div>


              <div
                class="order-details"
              >

                <span>
                  Customer request
                </span>

                <p>
                  ${message}
                </p>

              </div>


              <div
                class="admin-controls"
              >

                <label>

                  Order Status

                  <select
                    class="order-status-select"
                    data-order="${escapeHtml(
                      order.order_number
                    )}"
                  >

                    ${createStatusOptions(
                      order.status
                    )}

                  </select>

                </label>


                <label>

                  Admin Note

                  <textarea
                    class="admin-note"
                    data-order="${escapeHtml(
                      order.order_number
                    )}"
                    rows="4"
                    maxlength="5000"
                    placeholder="Private note about this order..."
                  >${escapeHtml(
                    order.admin_note || ''
                  )}</textarea>

                </label>


                <button
                  class="button primary save-order-button"
                  type="button"
                  data-order="${escapeHtml(
                    order.order_number
                  )}"
                >
                  Save Changes
                </button>

              </div>

            </article>

          `;

        }
      )
      .join('');

}


/*
|--------------------------------------------------------------------------
| STATUS OPTIONS
|--------------------------------------------------------------------------
*/

function createStatusOptions(
  currentStatus
) {

  const statuses = [

    'pending',

    'paid',

    'in_progress',

    'waiting_customer',

    'completed',

    'cancelled',

    'declined'

  ];


  return statuses
    .map(
      status => `

        <option
          value="${status}"
          ${
            status === currentStatus
              ? 'selected'
              : ''
          }
        >

          ${formatStatus(status)}

        </option>

      `
    )
    .join('');

}


/*
|--------------------------------------------------------------------------
| SAVE ORDER
|--------------------------------------------------------------------------
*/

document.addEventListener(
  'click',
  async event => {

    const button =
      event.target.closest(
        '.save-order-button'
      );


    if (!button) {
      return;
    }


    const orderNumber =
      button.dataset.order;


    const statusSelect =
      document.querySelector(
        `.order-status-select[data-order="${orderNumber}"]`
      );


    const noteInput =
      document.querySelector(
        `.admin-note[data-order="${orderNumber}"]`
      );


    if (
      !statusSelect ||
      !noteInput
    ) {

      return;

    }


    const originalText =
      button.textContent;


    button.disabled =
      true;


    button.textContent =
      'Saving...';


    try {

      await adminFetch(
        `/api/admin/orders/${encodeURIComponent(
          orderNumber
        )}`,
        {

          method:
            'PATCH',

          body:
            JSON.stringify({

              status:
                statusSelect.value,

              admin_note:
                noteInput.value

            })

        }
      );


      button.textContent =
        'Saved!';


      ordersMessage.textContent =
        `${orderNumber} updated successfully.`;


      await loadOrders();


      setTimeout(
        () => {

          button.textContent =
            originalText;

        },
        1000
      );

    } catch (error) {

      console.error(
        'Order update error:',
        error
      );


      button.disabled =
        false;


      button.textContent =
        originalText;


      ordersMessage.textContent =
        error.message;

    }

  }
);


/*
|--------------------------------------------------------------------------
| FILTER
|--------------------------------------------------------------------------
*/

if (statusFilter) {

  statusFilter.addEventListener(
    'change',
    loadOrders
  );

}


/*
|--------------------------------------------------------------------------
| REFRESH
|--------------------------------------------------------------------------
*/

if (refreshButton) {

  refreshButton.addEventListener(
    'click',
    loadOrders
  );

}


/*
|--------------------------------------------------------------------------
| LOGOUT
|--------------------------------------------------------------------------
*/

if (logoutButton) {

  logoutButton.addEventListener(
    'click',
    () => {

      clearAdminKey();

      showLogin();

    }
  );

}


/*
|--------------------------------------------------------------------------
| START
|--------------------------------------------------------------------------
*/

document.addEventListener(
  'DOMContentLoaded',
  async () => {

    const adminKey =
      getAdminKey();


    if (!adminKey) {

      showLogin();

      return;

    }


    try {

      await loadOrders();

      showDashboard();

    } catch (error) {

      clearAdminKey();

      showLogin();

    }

  }
);
