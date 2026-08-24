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

  const base =
    API_BASE_URL.replace(
      /\/$/,
      ''
    );


  return `${base}${path}`;

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
| ADMIN SESSION
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


/*
|--------------------------------------------------------------------------
| DASHBOARD DISPLAY
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


  const url =
    apiUrl(
      path
    );


  console.log(
    'TIMIFXX ADMIN FETCH:',
    url
  );


  let response;


  try {

    response =
      await fetch(
        url,
        {

          ...options,

          headers

        }
      );

  } catch (
    networkError
  ) {

    throw new Error(
      `Network error while connecting to ${url}`
    );

  }


  const rawText =
    await response.text();


  let data =
    {};


  try {

    data =
      rawText
        ? JSON.parse(
            rawText
          )
        : {};

  } catch (
    error
  ) {

    console.error(
      'INVALID API RESPONSE:',
      rawText
    );

  }


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
| ADMIN CHECK
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

      } catch (
        error
      ) {

        console.error(
          'ADMIN LOGIN ERROR:',
          error
        );


        clearAdminKey();


        loginMessage.textContent =
          error.message ||
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

    return;

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

  } catch (
    error
  ) {

    console.error(
      'ORDER LOADING ERROR:',
      error
    );


    ordersContainer.innerHTML =
      `
        <div class="orders-loading">
          Unable to load orders:
          ${escapeHtml(
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


  if (
    orders.length === 0
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
    orders
      .map(
        order =>
          `
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

                <span class="status-badge">

                  ${escapeHtml(
                    formatStatus(
                      order.status
                    )
                  )}

                </span>

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
    '========== LOAD SERVICES START =========='
  );


  console.log(
    'JS VERSION: 20'
  );


  console.log(
    'API BASE:',
    API_BASE_URL
  );


  if (!servicesAdminContainer) {

    console.error(
      'servicesAdminContainer was not found.'
    );

    return [];

  }


  servicesAdminContainer.innerHTML =
    `
      <div class="orders-loading">
        Loading services...
      </div>
    `;


  try {

    const endpoint =
      '/api/admin/services';


    console.log(
      'REQUESTING:',
      apiUrl(
        endpoint
      )
    );


    const data =
      await adminFetch(
        endpoint
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


    console.log(
      'SERVICES FOUND:',
      services.length
    );


    renderServices(
      services
    );


    return services;

  } catch (
    error
  ) {

    console.error(
      'ADMIN SERVICES ERROR:',
      error
    );


    servicesAdminContainer.innerHTML =
      `
        <div class="orders-loading">

          <strong>
            Unable to load services.
          </strong>

          <br>

          ${escapeHtml(
            error.message
          )}

          <br><br>

          Endpoint:
          ${escapeHtml(
            apiUrl(
              '/api/admin/services'
            )
          )}

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
    services.length === 0
  ) {

    servicesAdminContainer.innerHTML =
      `
        <div class="orders-loading">
          No services found in the database.
        </div>
      `;


    return;

  }


  servicesAdminContainer.innerHTML =
    services
      .map(
        service => {

          const price =
            service.price === null ||
            service.price === undefined
              ? ''
              : service.price;


          return `

            <article class="admin-service-card">

              <div class="admin-service-card-header">

                <div>

                  <span class="service-id-label">
                    Service #${escapeHtml(
                      service.id
                    )}
                  </span>


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

              </div>


              <div class="service-form-grid">

                <label>

                  Service Name

                  <input
                    class="edit-service-name"
                    type="text"
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
                    value="${escapeHtml(
                      price
                    )}"
                  >

                </label>


                <label>

                  Price Type

                  <select class="edit-service-price-type">

                    <option
                      value="fixed"
                      ${
                        service.price_type === 'fixed'
                          ? 'selected'
                          : ''
                      }
                    >
                      Fixed Price
                    </option>

                    <option
                      value="starting_from"
                      ${
                        service.price_type === 'starting_from'
                          ? 'selected'
                          : ''
                      }
                    >
                      Starting From
                    </option>

                    <option
                      value="contact"
                      ${
                        service.price_type === 'contact'
                          ? 'selected'
                          : ''
                      }
                    >
                      Contact Us
                    </option>

                  </select>

                </label>


                <label>

                  Turnaround Time

                  <input
                    class="edit-service-turnaround"
                    type="text"
                    value="${escapeHtml(
                      service.turnaround_text || ''
                    )}"
                  >

                </label>

              </div>


              <label>

                Description

                <textarea
                  class="edit-service-description"
                >${escapeHtml(
                  service.description || ''
                )}</textarea>

              </label>


              <label>

                <input
                  class="edit-service-active"
                  type="checkbox"
                  ${
                    service.is_active
                      ? 'checked'
                      : ''
                  }
                >

                Active

              </label>


              <div class="service-card-actions">

                <button
                  class="button primary save-service-button"
                  type="button"
                  data-service-id="${escapeHtml(
                    service.id
                  )}"
                >
                  Save Service
                </button>


                <button
                  class="button danger delete-service-button"
                  type="button"
                  data-service-id="${escapeHtml(
                    service.id
                  )}"
                  data-service-name="${escapeHtml(
                    service.name
                  )}"
                >
                  Delete
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
| CREATE SERVICE
|--------------------------------------------------------------------------
*/

if (createServiceForm) {

  createServiceForm.addEventListener(
    'submit',
    async event => {

      event.preventDefault();


      const name =
        serviceNameInput.value
          .trim();


      const priceType =
        servicePriceType.value;


      let price =
        servicePrice.value === ''
          ? null
          : Number(
              servicePrice.value
            );


      if (
        priceType === 'contact'
      ) {

        price =
          null;

      }


      try {

        if (serviceMessage) {

          serviceMessage.textContent =
            'Creating service...';

        }


        await adminFetch(
          '/api/admin/services',
          {

            method:
              'POST',

            body:
              JSON.stringify({

                name,

                description:
                  serviceDescription.value
                    .trim(),

                price,

                price_type:
                  priceType,

                turnaround_text:
                  serviceTurnaround.value
                    .trim(),

                is_active:
                  serviceActive.checked

              })

          }
        );


        createServiceForm.reset();


        serviceActive.checked =
          true;


        if (serviceMessage) {

          serviceMessage.textContent =
            'Service created successfully.';

        }


        await loadServices();

      } catch (
        error
      ) {

        console.error(
          'CREATE SERVICE ERROR:',
          error
        );


        if (serviceMessage) {

          serviceMessage.textContent =
            error.message ||
            'Unable to create service.';

        }

      }

    }
  );

}


/*
|--------------------------------------------------------------------------
| SAVE SERVICE
|--------------------------------------------------------------------------
*/

document.addEventListener(
  'click',
  async event => {

    const button =
      event.target.closest(
        '.save-service-button'
      );


    if (!button) {

      return;

    }


    const card =
      button.closest(
        '.admin-service-card'
      );


    const serviceId =
      button.dataset.serviceId;


    try {

      await adminFetch(
        `/api/admin/services/${serviceId}`,
        {

          method:
            'PATCH',

          body:
            JSON.stringify({

              name:
                card
                  .querySelector(
                    '.edit-service-name'
                  )
                  .value
                  .trim(),

              price:
                card
                  .querySelector(
                    '.edit-service-price'
                  )
                  .value,

              price_type:
                card
                  .querySelector(
                    '.edit-service-price-type'
                  )
                  .value,

              description:
                card
                  .querySelector(
                    '.edit-service-description'
                  )
                  .value
                  .trim(),

              turnaround_text:
                card
                  .querySelector(
                    '.edit-service-turnaround'
                  )
                  .value
                  .trim(),

              is_active:
                card
                  .querySelector(
                    '.edit-service-active'
                  )
                  .checked

            })

        }
      );


      if (serviceMessage) {

        serviceMessage.textContent =
          'Service updated successfully.';

      }


      await loadServices();

    } catch (
      error
    ) {

      console.error(
        'UPDATE SERVICE ERROR:',
        error
      );


      if (serviceMessage) {

        serviceMessage.textContent =
          error.message ||
          'Unable to update service.';

      }

    }

  }
);


/*
|--------------------------------------------------------------------------
| DELETE SERVICE
|--------------------------------------------------------------------------
*/

document.addEventListener(
  'click',
  async event => {

    const button =
      event.target.closest(
        '.delete-service-button'
      );


    if (!button) {

      return;

    }


    const serviceId =
      button.dataset.serviceId;


    const serviceName =
      button.dataset.serviceName;


    if (
      !window.confirm(
        `Delete "${serviceName}"?`
      )
    ) {

      return;

    }


    try {

      await adminFetch(
        `/api/admin/services/${serviceId}`,
        {

          method:
            'DELETE'

        }
      );


      if (serviceMessage) {

        serviceMessage.textContent =
          'Service deleted successfully.';

      }


      await loadServices();

    } catch (
      error
    ) {

      console.error(
        'DELETE SERVICE ERROR:',
        error
      );


      if (serviceMessage) {

        serviceMessage.textContent =
          error.message ||
          'Unable to delete service.';

      }

    }

  }
);


/*
|--------------------------------------------------------------------------
| REFRESH BUTTONS
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


      showLogin(
        'You have been logged out.'
      );

    }
  );

}


/*
|--------------------------------------------------------------------------
| START APPLICATION
|--------------------------------------------------------------------------
*/

document.addEventListener(
  'DOMContentLoaded',
  async () => {

    console.log(
      '========================================'
    );


    console.log(
      'TIMIFXX ADMIN JS VERSION 20 LOADED'
    );


    console.log(
      'API BASE URL:',
      API_BASE_URL
    );


    console.log(
      '========================================'
    );


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

    } catch (
      error
    ) {

      console.error(
        'ADMIN STARTUP ERROR:',
        error
      );


      clearAdminKey();


      showLogin(
        'Your session has expired. Please login again.'
      );

    }

  }
);
