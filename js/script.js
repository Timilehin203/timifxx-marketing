const API_BASE_URL =
  window.TIMIFXX_API_BASE_URL ||
  document
    .querySelector(
      'meta[name="api-base-url"]'
    )
    ?.content ||
  '';


function apiUrl(path) {

  const baseUrl =
    API_BASE_URL.replace(
      /\/$/,
      ''
    );


  return `${baseUrl}${path}`;

}


/*
|--------------------------------------------------------------------------
| REQUEST WITH TIMEOUT
|--------------------------------------------------------------------------
*/

async function fetchWithTimeout(
  url,
  options = {},
  timeout = 15000
) {

  const controller =
    new AbortController();


  const timeoutId =
    setTimeout(
      () => controller.abort(),
      timeout
    );


  try {

    return await fetch(
      url,
      {
        ...options,
        signal:
          controller.signal,

        cache:
          'no-store'
      }
    );

  } finally {

    clearTimeout(
      timeoutId
    );

  }

}


/*
|--------------------------------------------------------------------------
| HTML ESCAPING
|--------------------------------------------------------------------------
*/

function escapeHtml(value) {

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
| SERVICE AVATARS
|--------------------------------------------------------------------------
*/

function getServiceAvatar(service) {

  const slug =
    String(
      service.slug || ''
    )
      .toLowerCase();


  const name =
    String(
      service.name || ''
    )
      .toLowerCase();


  if (
    slug.includes('channel') ||
    name.includes('channel')
  ) {

    return '📢';

  }


  if (
    slug.includes('bot') ||
    name.includes('bot')
  ) {

    return '🤖';

  }


  if (
    slug.includes('miniapp') ||
    slug.includes('mini-app') ||
    name.includes('mini app')
  ) {

    return '📱';

  }


  if (
    slug.includes('approval') ||
    name.includes('approval')
  ) {

    return '✅';

  }


  if (
    slug.includes('setup') ||
    name.includes('setup')
  ) {

    return '⚙️';

  }


  if (
    slug.includes('copy') ||
    name.includes('copy')
  ) {

    return '✍️';

  }


  if (
    slug.includes('management') ||
    name.includes('management')
  ) {

    return '📈';

  }


  if (
    slug.includes('declined') ||
    name.includes('declined')
  ) {

    return '🔍';

  }


  if (
    slug.includes('compliance') ||
    name.includes('compliance')
  ) {

    return '🛡️';

  }


  if (
    slug.includes('audit') ||
    name.includes('audit')
  ) {

    return '📊';

  }


  return '🚀';

}


/*
|--------------------------------------------------------------------------
| PRICE FORMATTING
|--------------------------------------------------------------------------
*/

function formatPrice(service) {

  const price =
    Number(
      service.price
    );


  if (
    Number.isNaN(price)
  ) {

    return 'Contact us';

  }


  const formattedPrice =
    `$${price.toFixed(0)}`;


  if (
    service.price_type ===
    'starting_from'
  ) {

    return (
      `Starting from ${formattedPrice}`
    );

  }


  return formattedPrice;

}


/*
|--------------------------------------------------------------------------
| LOAD SERVICES
|--------------------------------------------------------------------------
*/

async function loadServices() {

  const grid =
    document.getElementById(
      'servicesGrid'
    );


  if (!grid) {

    return;

  }


  try {

    const response =
      await fetchWithTimeout(
        apiUrl(
          '/api/services'
        ),
        {

          method:
            'GET',

          headers: {

            Accept:
              'application/json'

          }

        }
      );


    if (!response.ok) {

      throw new Error(
        'Unable to load services.'
      );

    }


    const data =
      await response.json();


    const services =
      Array.isArray(
        data.services
      )
        ? data.services
        : [];


    grid.innerHTML =
      '';


    if (
      services.length === 0
    ) {

      grid.innerHTML = `

        <div class="loading-card">

          <span>
            No services are currently available.
          </span>

        </div>

      `;

      return;

    }


    for (
      const service of services
    ) {

      const card =
        document.createElement(
          'article'
        );


      card.className =
        'service-card';


      const avatar =
        getServiceAvatar(
          service
        );


      const priceText =
        formatPrice(
          service
        );


      const turnaround =
        service.turnaround_text ||
        'Contact for details';


      card.innerHTML = `

        <div class="service-avatar">

          ${avatar}

        </div>


        <h3>

          ${escapeHtml(
            service.name
          )}

        </h3>


        <p>

          ${escapeHtml(
            service.description ||
            'Professional Telegram marketing assistance.'
          )}

        </p>


        <div class="service-bottom">

          <div class="service-meta">

            <div class="price">

              ${escapeHtml(
                priceText
              )}

              ${
                priceText !==
                'Contact us'
                  ? '<small>USD</small>'
                  : ''
              }

            </div>


            <div class="turnaround">

              <strong>
                Turnaround
              </strong>

              ${escapeHtml(
                turnaround
              )}

            </div>

          </div>


          <a
            class="button secondary"
            href="order.html?service=${encodeURIComponent(
              service.id
            )}"
          >

            Order Service

          </a>

        </div>

      `;


      grid.appendChild(
        card
      );

    }

  } catch (error) {

    console.error(
      'Service loading error:',
      error
    );


    grid.innerHTML = `

      <div class="loading-card">

        <span>
          Unable to load services.
        </span>

        <small>
          Please refresh the page and try again.
        </small>

      </div>

    `;

  }

}


/*
|--------------------------------------------------------------------------
| ADMIN ELEMENTS
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


function setAdminKey(key) {

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
| SHOW ADMIN DASHBOARD
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
| SHOW ADMIN LOGIN
|--------------------------------------------------------------------------
*/

function showLogin() {

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

}


/*
|--------------------------------------------------------------------------
| ADMIN API REQUEST
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


  const response =
    await fetchWithTimeout(
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
        `Request failed with status ${response.status}.`
      );


    error.status =
      response.status;


    throw error;

  }


  return data;

}


/*
|--------------------------------------------------------------------------
| CHECK ADMIN ACCESS
|--------------------------------------------------------------------------
*/

async function checkAdminAccess() {

  return await adminFetch(
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
        adminKeyInput
          ? adminKeyInput.value.trim()
          : '';


      if (!key) {

        if (loginMessage) {

          loginMessage.textContent =
            'Enter your admin access key.';

        }

        return;

      }


      const loginButton =
        loginForm.querySelector(
          'button[type="submit"]'
        );


      if (loginButton) {

        loginButton.disabled =
          true;


        loginButton.textContent =
          'Checking...';

      }


      if (loginMessage) {

        loginMessage.textContent =
          'Checking access...';

      }


      setAdminKey(
        key
      );


      try {

        await checkAdminAccess();


        if (loginMessage) {

          loginMessage.textContent =
            'Access granted. Loading orders...';

        }


        await loadOrders();


        showDashboard();


        window.location.hash =
          'admin';

      } catch (error) {

        console.error(
          'Admin login error:',
          error
        );


        clearAdminKey();


        let message =
          'Unable to connect to the admin system.';


        if (
          error.name ===
          'AbortError'
        ) {

          message =
            'Connection timed out. Please try again.';

        } else if (
          error.status === 401
        ) {

          message =
            'Invalid admin access key.';

        } else if (
          error.message
        ) {

          message =
            error.message;

        }


        if (loginMessage) {

          loginMessage.textContent =
            message;

        }

      } finally {

        if (loginButton) {

          loginButton.disabled =
            false;


          loginButton.textContent =
            'Login';

        }

      }

    }
  );

}


/*
|--------------------------------------------------------------------------
| LOAD ADMIN ORDERS
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


  ordersContainer.innerHTML = `

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
      error.status === 401
    ) {

      clearAdminKey();


      showLogin();


      if (loginMessage) {

        loginMessage.textContent =
          'Your session has expired. Please login again.';

      }

    }


    ordersContainer.innerHTML = `

      <div class="orders-loading">

        Unable to load orders.

      </div>

    `;


    if (ordersMessage) {

      ordersMessage.textContent =
        error.name ===
        'AbortError'
          ? 'Connection timed out. Please try again.'
          : (
              error.message ||
              'Unable to load orders.'
            );

    }


    throw error;

  }

}


/*
|--------------------------------------------------------------------------
| UPDATE SUMMARY
|--------------------------------------------------------------------------
*/

function updateSummary(orders) {

  if (totalOrders) {

    totalOrders.textContent =
      orders.length;

  }


  if (pendingOrders) {

    pendingOrders.textContent =
      orders.filter(
        order =>
          order.status ===
          'pending'
      ).length;

  }


  if (progressOrders) {

    progressOrders.textContent =
      orders.filter(
        order =>
          order.status ===
          'in_progress'
      ).length;

  }


  if (completedOrders) {

    completedOrders.textContent =
      orders.filter(
        order =>
          order.status ===
          'completed'
      ).length;

  }

}


/*
|--------------------------------------------------------------------------
| FORMAT STATUS
|--------------------------------------------------------------------------
*/

function formatStatus(status) {

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


/*
|--------------------------------------------------------------------------
| RENDER ORDERS
|--------------------------------------------------------------------------
*/

function renderOrders(orders) {

  const filter =
    statusFilter
      ? statusFilter.value
      : '';


  const filteredOrders =
    filter
      ? orders.filter(
          order =>
            order.status ===
            filter
        )
      : orders;


  if (
    filteredOrders.length === 0
  ) {

    ordersContainer.innerHTML = `

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
                      order.service_name ||
                      'Service'
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


    const newStatus =
      statusSelect.value;


    button.disabled =
      true;


    button.textContent =
      'Saving...';


    if (ordersMessage) {

      ordersMessage.textContent =
        `Saving changes for ${orderNumber}...`;

    }


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
                  newStatus,

                admin_note:
                  noteInput.value
                    .trim()

              })

          }
        );


      if (
        !data.order
      ) {

        throw new Error(
          'The server did not return the updated order.'
        );

      }


      if (
        data.order.status !==
        newStatus
      ) {

        throw new Error(
          `Status update failed. Server returned "${data.order.status}".`
        );

      }


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


      button.disabled =
        false;


      button.textContent =
        originalText;


      if (ordersMessage) {

        ordersMessage.textContent =
          error.name ===
          'AbortError'
            ? 'Connection timed out. Please try again.'
            : (
                error.message ||
                'Unable to update order.'
              );

      }

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
    () => {

      loadOrders()
        .catch(
          error => {

            console.error(
              'Filter error:',
              error
            );

          }
        );

    }
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
    () => {

      loadOrders()
        .catch(
          error => {

            console.error(
              'Refresh error:',
              error
            );

          }
        );

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


      if (loginMessage) {

        loginMessage.textContent =
          'You have been logged out.';

      }

    }
  );

}


/*
|--------------------------------------------------------------------------
| START WEBSITE
|--------------------------------------------------------------------------
*/

document.addEventListener(
  'DOMContentLoaded',
  async () => {

    /*
    |--------------------------------------------------------------
    | LOAD PUBLIC SERVICES
    |--------------------------------------------------------------
    */

    loadServices();


    /*
    |--------------------------------------------------------------
    | CHECK ADMIN SESSION
    |--------------------------------------------------------------
    */

    const adminKey =
      getAdminKey();


    if (!adminKey) {

      showLogin();

      return;

    }


    try {

      await checkAdminAccess();


      await loadOrders();


      showDashboard();

    } catch (error) {

      console.error(
        'Admin startup error:',
        error
      );


      clearAdminKey();


      showLogin();

    }

  }
);
