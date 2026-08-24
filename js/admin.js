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


const createServiceForm =
  document.getElementById(
    'createServiceForm'
  );


const serviceNameInput =
  document.getElementById(
    'serviceName'
  );


const servicePrice =
  document.getElementById(
    'servicePrice'
  );


const servicePriceType =
  document.getElementById(
    'servicePriceType'
  );


const serviceTurnaround =
  document.getElementById(
    'serviceTurnaround'
  );


const serviceDescription =
  document.getElementById(
    'serviceDescription'
  );


const serviceActive =
  document.getElementById(
    'serviceActive'
  );


const createServiceButton =
  document.getElementById(
    'createServiceButton'
  );


const serviceMessage =
  document.getElementById(
    'serviceMessage'
  );


const servicesAdminContainer =
  document.getElementById(
    'servicesAdminContainer'
  );


const refreshServicesButton =
  document.getElementById(
    'refreshServicesButton'
  );


const refreshServicesButtonBottom =
  document.getElementById(
    'refreshServicesButtonBottom'
  );


let currentOrders =
  [];


/*
|--------------------------------------------------------------------------
| ADMIN KEY
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
| ESCAPE HTML
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

function showLogin(
  message = ''
) {

  dashboard.hidden =
    true;


  loginScreen.hidden =
    false;


  adminKeyInput.value =
    '';


  loginMessage.textContent =
    message;

}


/*
|--------------------------------------------------------------------------
| ADMIN FETCH
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


  const response =
    await fetch(
      apiUrl(
        path
      ),
      {

        ...options,

        headers,

        cache:
          'no-store'

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
| CHECK ADMIN
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


      await loadOrders();


      await loadServices();

    } catch (
      error
    ) {

      clearAdminKey();


      loginMessage.textContent =
        error.message;

    }

  }
);


/*
|--------------------------------------------------------------------------
| LOAD ORDERS
|--------------------------------------------------------------------------
*/

async function loadOrders() {

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


    currentOrders =
      Array.isArray(
        data.orders
      )
        ? data.orders
        : [];


    updateSummary(
      currentOrders
    );


    renderOrders(
      currentOrders
    );


    ordersMessage.textContent =
      `${currentOrders.length} order(s) loaded.`;

  } catch (
    error
  ) {

    console.error(
      'ORDER ERROR:',
      error
    );


    ordersContainer.innerHTML =
      `
        <div class="orders-loading">
          Unable to load orders: ${escapeHtml(
            error.message
          )}
        </div>
      `;

  }

}


/*
|--------------------------------------------------------------------------
| ORDER SUMMARY
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


  const filtered =
    filter
      ? orders.filter(
          order =>
            order.status === filter
        )
      : orders;


  if (
    filtered.length === 0
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
    filtered
      .map(
        order => `

          <article class="admin-order-card">

            <div class="order-card-top">

              <div>

                <span class="order-number">
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

            <div class="order-info-grid">

              <div>

                <span>Customer</span>

                <strong>
                  ${escapeHtml(
                    order.customer_name
                  )}
                </strong>

              </div>

              <div>

                <span>Email</span>

                <strong>
                  ${escapeHtml(
                    order.customer_email
                  )}
                </strong>

              </div>

              <div>

                <span>Price</span>

                <strong>
                  $${Number(
                    order.price || 0
                  ).toFixed(2)}
                </strong>

              </div>

            </div>

          </article>

        `
      )
      .join('');

}


/*
|--------------------------------------------------------------------------
| LOAD SERVICES
|--------------------------------------------------------------------------
*/

async function loadServices() {

  console.log(
    'LOADING ADMIN SERVICES...'
  );


  servicesAdminContainer.innerHTML =
    `
      <div class="orders-loading">
        Loading services...
      </div>
    `;


  try {

    const data =
      await adminFetch(
        '/api/admin/services'
      );


    console.log(
      'ADMIN SERVICES RESPONSE:',
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


    serviceMessage.textContent =
      `${services.length} service(s) loaded.`;

  } catch (
    error
  ) {

    console.error(
      'SERVICE LOADING ERROR:',
      error
    );


    servicesAdminContainer.innerHTML =
      `
        <div class="orders-loading">
          Unable to load services.

          <br>

          ${escapeHtml(
            error.message
          )}
        </div>
      `;


    serviceMessage.textContent =
      error.message;

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

  if (
    services.length === 0
  ) {

    servicesAdminContainer.innerHTML =
      `
        <div class="orders-loading">
          No services found.
        </div>
      `;

    return;

  }


  servicesAdminContainer.innerHTML =
    services
      .map(
        service => `

          <article
            class="admin-service-card"
            data-service-id="${service.id}"
          >

            <div class="admin-service-card-header">

              <div>

                <h3>
                  ${escapeHtml(
                    service.name
                  )}
                </h3>

                <span>
                  ${
                    service.is_active
                      ? 'Active'
                      : 'Inactive'
                  }
                </span>

              </div>

              <button
                class="button ghost delete-service-button"
                data-service-id="${service.id}"
                type="button"
              >
                Delete
              </button>

            </div>


            <div class="service-form-grid">

              <label>

                Service Name

                <input
                  class="edit-service-name"
                  value="${escapeHtml(
                    service.name
                  )}"
                >

              </label>


              <label>

                Price

                <input
                  class="edit-service-price"
                  type="number"
                  step="0.01"
                  value="${
                    service.price ??
                    ''
                  }"
                >

              </label>

            </div>


            <button
              class="button primary save-service-button"
              data-service-id="${service.id}"
              type="button"
            >
              Save Service
            </button>

          </article>

        `
      )
      .join('');

}


/*
|--------------------------------------------------------------------------
| CREATE SERVICE
|--------------------------------------------------------------------------
*/

createServiceForm.addEventListener(
  'submit',
  async event => {

    event.preventDefault();


    try {

      await adminFetch(
        '/api/admin/services',
        {

          method:
            'POST',

          body:
            JSON.stringify({

              name:
                serviceNameInput.value.trim(),

              description:
                serviceDescription.value.trim(),

              price:
                servicePrice.value === ''
                  ? null
                  : Number(
                      servicePrice.value
                    ),

              price_type:
                servicePriceType.value,

              turnaround_text:
                serviceTurnaround.value.trim(),

              is_active:
                serviceActive.checked

            })

        }
      );


      serviceMessage.textContent =
        'Service created successfully.';


      createServiceForm.reset();


      serviceActive.checked =
        true;


      await loadServices();

    } catch (
      error
    ) {

      serviceMessage.textContent =
        error.message;

    }

  }
);


/*
|--------------------------------------------------------------------------
| REFRESH SERVICES
|--------------------------------------------------------------------------
*/

if (refreshServicesButton) {

  refreshServicesButton.addEventListener(
    'click',
    loadServices
  );

}


if (refreshServicesButtonBottom) {

  refreshServicesButtonBottom.addEventListener(
    'click',
    loadServices
  );

}


/*
|--------------------------------------------------------------------------
| REFRESH ORDERS
|--------------------------------------------------------------------------
*/

refreshButton.addEventListener(
  'click',
  loadOrders
);


/*
|--------------------------------------------------------------------------
| FILTER
|--------------------------------------------------------------------------
*/

statusFilter.addEventListener(
  'change',
  () => {

    renderOrders(
      currentOrders
    );

  }
);


/*
|--------------------------------------------------------------------------
| LOGOUT
|--------------------------------------------------------------------------
*/

logoutButton.addEventListener(
  'click',
  () => {

    clearAdminKey();


    showLogin(
      'You have been logged out.'
    );

  }
);


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


      await loadOrders();


      await loadServices();

    } catch (
      error
    ) {

      console.error(
        'STARTUP ERROR:',
        error
      );


      clearAdminKey();


      showLogin(
        'Please login again.'
      );

    }

  }
);
