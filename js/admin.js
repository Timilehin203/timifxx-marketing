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


const servicesAdminContainer =
  document.getElementById(
    'servicesAdminContainer'
  );


const refreshServicesButton =
  document.getElementById(
    'refreshServicesButton'
  );


const serviceMessage =
  document.getElementById(
    'serviceMessage'
  );


let currentOrders =
  [];


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
| FORMATTERS
|--------------------------------------------------------------------------
*/

function formatStatus(
  status
) {

  return String(
    status || ''
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


function formatPrice(
  price,
  priceType
) {

  if (
    priceType === 'contact'
  ) {

    return 'Contact Us';

  }


  const numericPrice =
    Number(
      price
    );


  if (
    !Number.isFinite(
      numericPrice
    )
  ) {

    return 'Price unavailable';

  }


  if (
    priceType === 'starting_from'
  ) {

    return `From $${numericPrice.toFixed(2)}`;

  }


  return `$${numericPrice.toFixed(2)}`;

}


/*
|--------------------------------------------------------------------------
| SHOW DASHBOARD
|--------------------------------------------------------------------------
*/

function showDashboard() {

  if (loginScreen) {

    loginScreen.hidden =
      true;

  }


  if (dashboard) {

    dashboard.hidden =
      false;

  }

}


/*
|--------------------------------------------------------------------------
| SHOW LOGIN
|--------------------------------------------------------------------------
*/

function showLogin(
  message = ''
) {

  if (dashboard) {

    dashboard.hidden =
      true;

  }


  if (loginScreen) {

    loginScreen.hidden =
      false;

  }


  if (adminKeyInput) {

    adminKeyInput.value =
      '';

  }


  if (loginMessage) {

    loginMessage.textContent =
      message;

  }

}


/*
|--------------------------------------------------------------------------
| HANDLE SESSION ERROR
|--------------------------------------------------------------------------
*/

function handleSessionError(
  error
) {

  if (
    error &&
    error.status === 401
  ) {

    clearAdminKey();

    showLogin(
      'Your session has expired. Please login again.'
    );

    return true;

  }


  return false;

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


  if (!adminKey) {

    const error =
      new Error(
        'Admin access key is missing.'
      );

    error.status =
      401;

    throw error;

  }


  const headers = {

    Accept:
      'application/json',

    Authorization:
      `Bearer ${adminKey}`,

    ...(
      options.headers || {}
    )

  };


  if (options.body) {

    headers[
      'Content-Type'
    ] =
      'application/json';

  }


  let response;


  try {

    response =
      await fetch(
        apiUrl(path),
        {

          ...options,

          headers

        }
      );

  } catch (networkError) {

    const error =
      new Error(
        'Unable to connect to the server.'
      );

    error.status =
      0;

    throw error;

  }


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
        data.error ||
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
| PUBLIC API REQUEST
|--------------------------------------------------------------------------
*/

async function publicFetch(
  path
) {

  let response;


  try {

    response =
      await fetch(
        apiUrl(path),
        {

          headers: {

            Accept:
              'application/json'

          }

        }
      );

  } catch (networkError) {

    throw new Error(
      'Unable to connect to the server.'
    );

  }


  const data =
    await response
      .json()
      .catch(
        () => ({})
      );


  if (!response.ok) {

    throw new Error(
      data.message ||
      data.error ||
      'Request failed.'
    );

  }


  return data;

}


/*
|--------------------------------------------------------------------------
| ADMIN ACCESS CHECK
|--------------------------------------------------------------------------
*/

async function checkAdminAccess() {

  return adminFetch(
    '/api/admin/check'
  );

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

        await checkAdminAccess();


        showDashboard();


        loginMessage.textContent =
          '';


        await Promise.all(

          [

            loadOrders(),

            loadServices()

          ]

        );

      } catch (error) {

        console.error(
          'Admin login error:',
          error
        );


        clearAdminKey();


        loginMessage.textContent =
          error.status === 401
            ? 'Invalid admin access key.'
            : error.message ||
              'Unable to connect to the admin system.';

      }

    }
  );

}


/*
|--------------------------------------------------------------------------
| LOAD ORDERS
|--------------------------------------------------------------------------
*/

async function loadOrders() {

  if (!ordersContainer) {

    return [];

  }


  if (ordersMessage) {

    ordersMessage.textContent =
      '';

  }


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


    currentOrders =
      orders;


    updateSummary(
      orders
    );


    renderOrders(
      orders
    );


    if (ordersMessage) {

      ordersMessage.textContent =
        `${orders.length} order${
          orders.length === 1
            ? ''
            : 's'
        } loaded.`;

    }


    return orders;

  } catch (error) {

    console.error(
      'Order loading error:',
      error
    );


    if (
      handleSessionError(
        error
      )
    ) {

      return [];

    }


    ordersContainer.innerHTML =
      `
        <div class="orders-loading">
          Unable to load orders.
        </div>
      `;


    if (ordersMessage) {

      ordersMessage.textContent =
        error.message ||
        'Unable to load orders.';

    }


    return [];

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

  if (totalOrders) {

    totalOrders.textContent =
      orders.length;

  }


  if (pendingOrders) {

    pendingOrders.textContent =
      orders.filter(
        order =>
          order.status === 'pending'
      ).length;

  }


  if (progressOrders) {

    progressOrders.textContent =
      orders.filter(
        order =>
          order.status === 'in_progress'
      ).length;

  }


  if (completedOrders) {

    completedOrders.textContent =
      orders.filter(
        order =>
          order.status === 'completed'
      ).length;

  }

}


/*
|--------------------------------------------------------------------------
| RENDER ORDERS
|--------------------------------------------------------------------------
*/

function renderOrders(
  orders
) {

  if (!ordersContainer) {

    return;

  }


  const filter =
    statusFilter
      ? statusFilter.value
      : '';


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
            order.created_at
              ? new Date(
                  order.created_at
                ).toLocaleString()
              : 'Unknown';


          const message =
            order.message
              ? escapeHtml(
                  order.message
                )
              : 'No additional details provided.';


          const price =
            Number(
              order.price || 0
            );


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
                    $${price.toFixed(2)}
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
                  Customer Request
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
          ${formatStatus(
            status
          )}
        </option>

      `
    )
    .join('');

}


/*
|--------------------------------------------------------------------------
| LOAD EXISTING SERVICES
|--------------------------------------------------------------------------
*/

async function loadServices() {

  if (!servicesAdminContainer) {

    console.error(
      'servicesAdminContainer was not found.'
    );

    return [];

  }


  servicesAdminContainer.innerHTML =
    `
      <div class="orders-loading">
        Loading existing services...
      </div>
    `;


  if (serviceMessage) {

    serviceMessage.textContent =
      '';

  }


  try {

    /*
    |--------------------------------------------------------------------------
    | IMPORTANT
    |--------------------------------------------------------------------------
    |
    | Existing services already work on:
    |
    | GET /api/services
    |
    | Your Railway logs confirmed this endpoint returns 200.
    |
    |--------------------------------------------------------------------------
    */

    const data =
      await publicFetch(
        '/api/services'
      );


    console.log(
      'SERVICES RESPONSE:',
      data
    );


    const services =
      Array.isArray(
        data.services
      )
        ? data.services
        : [];


    renderServices(
      services
    );


    if (serviceMessage) {

      serviceMessage.textContent =
        `${services.length} service${
          services.length === 1
            ? ''
            : 's'
        } loaded successfully.`;

    }


    return services;

  } catch (error) {

    console.error(
      'Service loading error:',
      error
    );


    servicesAdminContainer.innerHTML =
      `
        <div class="orders-loading">
          Unable to load services.
        </div>
      `;


    if (serviceMessage) {

      serviceMessage.textContent =
        error.message ||
        'Unable to load services.';

    }


    return [];

  }

}


/*
|--------------------------------------------------------------------------
| RENDER SERVICES
|--------------------------------------------------------------------------
*/

function renderServices(
  services
) {

  if (!servicesAdminContainer) {

    return;

  }


  if (
    !Array.isArray(
      services
    ) ||
    services.length === 0
  ) {

    servicesAdminContainer.innerHTML =
      `
        <div class="orders-loading">
          No active services found.
        </div>
      `;

    return;

  }


  servicesAdminContainer.innerHTML =
    services
      .map(
        service => {

          const serviceName =
            escapeHtml(
              service.name ||
              'Unnamed Service'
            );


          const description =
            escapeHtml(
              service.description ||
              'No description provided.'
            );


          const turnaround =
            escapeHtml(
              service.turnaround_text ||
              'Not specified'
            );


          const price =
            formatPrice(
              service.price,
              service.price_type
            );


          return `

            <article
              class="admin-order-card admin-service-card"
            >

              <div
                class="order-card-top"
              >

                <div>

                  <span
                    class="order-number"
                  >
                    SERVICE #${escapeHtml(
                      service.id
                    )}
                  </span>

                  <h3>
                    ${serviceName}
                  </h3>

                </div>


                <span
                  class="status-badge status-completed"
                >
                  Active
                </span>

              </div>


              <div
                class="order-info-grid"
              >

                <div>

                  <span>
                    Price
                  </span>

                  <strong>
                    ${escapeHtml(
                      price
                    )}
                  </strong>

                </div>


                <div>

                  <span>
                    Turnaround
                  </span>

                  <strong>
                    ${turnaround}
                  </strong>

                </div>


                <div>

                  <span>
                    Service ID
                  </span>

                  <strong>
                    ${escapeHtml(
                      service.id
                    )}
                  </strong>

                </div>

              </div>


              <div
                class="order-details"
              >

                <span>
                  Service Description
                </span>

                <p>
                  ${description}
                </p>

              </div>

            </article>

          `;

        }
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

      const data =
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
                    .trim()

              })

          }
        );


      button.textContent =
        'Saved!';


      if (ordersMessage) {

        ordersMessage.textContent =
          `${orderNumber} changed to ${formatStatus(
            data.order.status
          )}.`;

      }


      await loadOrders();

    } catch (error) {

      console.error(
        'Order update error:',
        error
      );


      if (
        handleSessionError(
          error
        )
      ) {

        return;

      }


      button.disabled =
        false;


      button.textContent =
        originalText;


      if (ordersMessage) {

        ordersMessage.textContent =
          error.message ||
          'Unable to update order.';

      }

    }

  }
);


/*
|--------------------------------------------------------------------------
| FILTER ORDERS
|--------------------------------------------------------------------------
*/

if (statusFilter) {

  statusFilter.addEventListener(
    'change',
    () => {

      renderOrders(
        currentOrders
      );

    }
  );

}


/*
|--------------------------------------------------------------------------
| REFRESH EVERYTHING
|--------------------------------------------------------------------------
*/

if (refreshButton) {

  refreshButton.addEventListener(
    'click',
    async () => {

      await Promise.all(

        [

          loadOrders(),

          loadServices()

        ]

      );

    }
  );

}


/*
|--------------------------------------------------------------------------
| REFRESH SERVICES
|--------------------------------------------------------------------------
*/

if (refreshServicesButton) {

  refreshServicesButton.addEventListener(
    'click',
    () => {

      loadServices();

    }
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

      await checkAdminAccess();


      showDashboard();


      await Promise.all(

        [

          loadOrders(),

          loadServices()

        ]

      );

    } catch (error) {

      console.error(
        'Admin startup error:',
        error
      );


      clearAdminKey();


      showLogin(
        error.status === 401
          ? 'Your session has expired. Please login again.'
          : 'Unable to connect to the admin system.'
      );

    }

  }
);
