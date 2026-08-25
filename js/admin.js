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


/*
|--------------------------------------------------------------------------
| SERVICE ELEMENTS
|--------------------------------------------------------------------------
*/

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


/*
|--------------------------------------------------------------------------
| APPLICATION STATE
|--------------------------------------------------------------------------
*/

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


function formatPrice(
  price
) {

  if (
    price === null ||
    price === undefined ||
    price === ''
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

    return escapeHtml(
      price
    );

  }


  return `$${numericPrice.toFixed(2)}`;

}


function formatDate(
  value
) {

  if (!value) {

    return '—';

  }


  const date =
    new Date(
      value
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return escapeHtml(
      value
    );

  }


  return date.toLocaleString();

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


  if (
    response.status === 401
  ) {

    clearAdminKey();

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


      if (loginMessage) {

        loginMessage.textContent =
          'Checking access...';

      }


      setAdminKey(
        key
      );


      try {

        await checkAdminAccess();


        showDashboard();


        if (loginMessage) {

          loginMessage.textContent =
            '';

        }


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


        if (loginMessage) {

          loginMessage.textContent =
            error.message ||
            'Unable to connect to the admin system.';

        }

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


    applyOrderFilter();


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


    if (
      error.status === 401
    ) {

      showLogin(
        'Your session has expired. Please login again.'
      );

    }

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
| ORDER FILTER
|--------------------------------------------------------------------------
*/

function applyOrderFilter() {

  const selectedStatus =
    statusFilter
      ? statusFilter.value
      : 'all';


  const filteredOrders =
    selectedStatus === 'all' ||
    !selectedStatus
      ? currentOrders
      : currentOrders.filter(
          order =>
            order.status ===
            selectedStatus
        );


  renderOrders(
    filteredOrders
  );


  if (ordersMessage) {

    ordersMessage.textContent =
      `${filteredOrders.length} order${
        filteredOrders.length === 1
          ? ''
          : 's'
      } shown.`;

  }

}


if (statusFilter) {

  statusFilter.addEventListener(
    'change',
    applyOrderFilter
  );

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
          {

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
                        'Unknown Service'
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
                  class="order-details-grid"
                >

                  <div>

                    <strong>
                      Customer
                    </strong>

                    <span>
                      ${escapeHtml(
                        order.customer_name ||
                        'Not provided'
                      )}
                    </span>

                  </div>


                  <div>

                    <strong>
                      Email
                    </strong>

                    <span>
                      ${escapeHtml(
                        order.customer_email ||
                        'Not provided'
                      )}
                    </span>

                  </div>


                  <div>

                    <strong>
                      Telegram
                    </strong>

                    <span>
                      ${escapeHtml(
                        order.telegram_username ||
                        'Not provided'
                      )}
                    </span>

                  </div>


                  <div>

                    <strong>
                      WhatsApp
                    </strong>

                    <span>
                      ${escapeHtml(
                        order.whatsapp ||
                        'Not provided'
                      )}
                    </span>

                  </div>


                  <div>

                    <strong>
                      Price
                    </strong>

                    <span>
                      ${formatPrice(
                        order.price
                      )}
                    </span>

                  </div>


                  <div>

                    <strong>
                      Created
                    </strong>

                    <span>
                      ${escapeHtml(
                        formatDate(
                          order.created_at
                        )
                      )}
                    </span>

                  </div>

                </div>


                <div
                  class="order-request-section"
                >

                  <strong>
                    Customer Request
                  </strong>


                  <div
                    class="order-message"
                  >
                    ${escapeHtml(
                      order.message ||
                      'No additional message provided.'
                    )}
                  </div>

                </div>


                <div
                  class="order-edit-grid"
                >

                  <label>

                    Order Status

                    <select
                      class="edit-order-status"
                    >

                      <option
                        value="pending"
                        ${
                          order.status === 'pending'
                            ? 'selected'
                            : ''
                        }
                      >
                        Pending
                      </option>


                      <option
                        value="paid"
                        ${
                          order.status === 'paid'
                            ? 'selected'
                            : ''
                        }
                      >
                        Paid
                      </option>


                      <option
                        value="in_progress"
                        ${
                          order.status === 'in_progress'
                            ? 'selected'
                            : ''
                        }
                      >
                        In Progress
                      </option>


                      <option
                        value="waiting_customer"
                        ${
                          order.status ===
                          'waiting_customer'
                            ? 'selected'
                            : ''
                        }
                      >
                        Waiting Customer
                      </option>


                      <option
                        value="completed"
                        ${
                          order.status === 'completed'
                            ? 'selected'
                            : ''
                        }
                      >
                        Completed
                      </option>


                      <option
                        value="cancelled"
                        ${
                          order.status === 'cancelled'
                            ? 'selected'
                            : ''
                        }
                      >
                        Cancelled
                      </option>


                      <option
                        value="declined"
                        ${
                          order.status === 'declined'
                            ? 'selected'
                            : ''
                        }
                      >
                        Declined
                      </option>

                    </select>

                  </label>


                  <label>

                    Admin Note

                    <textarea
                      class="edit-order-note"
                      maxlength="5000"
                      placeholder="Add a private admin note..."
                    >${escapeHtml(
                      order.admin_note || ''
                    )}</textarea>

                  </label>

                </div>


                <div
                  class="order-card-actions"
                >

                  <button
                    class="button primary save-order-button"
                    type="button"
                    data-order-number="${escapeHtml(
                      order.order_number
                    )}"
                  >
                    Save Changes
                  </button>

                </div>


                ${
                  order.completed_at
                    ? `
                      <div
                        class="order-completed-info"
                      >

                        Completed:
                        ${escapeHtml(
                          formatDate(
                            order.completed_at
                          )
                        )}

                      </div>
                    `
                    : ''
                }

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


    const card =
      button.closest(
        '.admin-order-card'
      );


    if (!card) {

      return;

    }


    const orderNumber =
      button.dataset.orderNumber;


    const statusInput =
      card.querySelector(
        '.edit-order-status'
      );


    const noteInput =
      card.querySelector(
        '.edit-order-note'
      );


    if (
      !orderNumber ||
      !statusInput ||
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
                statusInput.value,

              admin_note:
                noteInput.value
                  .trim()

            })

        }
      );


      if (ordersMessage) {

        ordersMessage.textContent =
          `Order ${orderNumber} updated successfully.`;

      }


      await loadOrders();

    } catch (
      error
    ) {

      console.error(
        'ORDER UPDATE ERROR:',
        error
      );


      if (ordersMessage) {

        ordersMessage.textContent =
          error.message ||
          'Unable to update order.';

      }


      button.disabled =
        false;


      button.textContent =
        originalText;

    }

  }
);


/*
|--------------------------------------------------------------------------
| LOAD SERVICES
|--------------------------------------------------------------------------
*/

async function loadServices() {

  if (!servicesAdminContainer) {

    return [];

  }


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


    const services =
      Array.isArray(
        data.services
      )
        ? data.services
        : [];


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

          <br><br>

          ${escapeHtml(
            error.message
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

            <article
              class="admin-service-card"
            >

              <div
                class="admin-service-card-header"
              >

                <div>

                  <span
                    class="service-id-label"
                  >
                    Service #${escapeHtml(
                      service.id
                    )}
                  </span>


                  <h3>
                    ${escapeHtml(
                      service.name
                    )}
                  </h3>


                  <span
                    class="service-status-label"
                  >
                    ${
                      service.is_active
                        ? 'Active'
                        : 'Inactive'
                    }
                  </span>

                </div>

              </div>


              <div
                class="service-form-grid"
              >

                <label>

                  Service Name

                  <input
                    class="edit-service-name"
                    type="text"
                    maxlength="150"
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
                    min="0"
                    step="0.01"
                    value="${escapeHtml(
                      price
                    )}"
                  >

                </label>


                <label>

                  Price Type

                  <select
                    class="edit-service-price-type"
                  >

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
                        service.price_type ===
                        'starting_from'
                          ? 'selected'
                          : ''
                      }
                    >
                      Starting From
                    </option>


                    <option
                      value="contact"
                      ${
                        service.price_type ===
                        'contact'
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
                    maxlength="150"
                    value="${escapeHtml(
                      service.turnaround_text ||
                      ''
                    )}"
                  >

                </label>

              </div>


              <label>

                Description

                <textarea
                  class="edit-service-description"
                  maxlength="3000"
                >${escapeHtml(
                  service.description ||
                  ''
                )}</textarea>

              </label>


              <label
                class="service-active-toggle"
              >

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


              <div
                class="service-card-actions"
              >

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
        serviceNameInput
          ? serviceNameInput.value.trim()
          : '';


      const priceType =
        servicePriceType
          ? servicePriceType.value
          : 'fixed';


      let price =
        servicePrice &&
        servicePrice.value !== ''
          ? Number(
              servicePrice.value
            )
          : null;


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
                  serviceDescription
                    ? serviceDescription.value.trim()
                    : '',

                price,

                price_type:
                  priceType,

                turnaround_text:
                  serviceTurnaround
                    ? serviceTurnaround.value.trim()
                    : '',

                is_active:
                  serviceActive
                    ? serviceActive.checked
                    : true

              })

          }
        );


        createServiceForm.reset();


        if (serviceActive) {

          serviceActive.checked =
            true;

        }


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


    if (!card) {

      return;

    }


    const serviceId =
      button.dataset.serviceId;


    const priceType =
      card
        .querySelector(
          '.edit-service-price-type'
        )
        .value;


    let price =
      card
        .querySelector(
          '.edit-service-price'
        )
        .value;


    if (
      priceType === 'contact'
    ) {

      price =
        null;

    }


    const originalText =
      button.textContent;


    button.disabled =
      true;


    button.textContent =
      'Saving...';


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

              price,

              price_type:
                priceType,

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


      button.disabled =
        false;


      button.textContent =
        originalText;

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


    const originalText =
      button.textContent;


    button.disabled =
      true;


    button.textContent =
      'Deleting...';


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


      button.disabled =
        false;


      button.textContent =
        originalText;

    }

  }
);


/*
|--------------------------------------------------------------------------
| SERVICE PRICE TYPE HANDLING
|--------------------------------------------------------------------------
*/

function updatePriceField(
  priceTypeElement,
  priceInputElement
) {

  if (
    !priceTypeElement ||
    !priceInputElement
  ) {

    return;

  }


  const isContact =
    priceTypeElement.value ===
    'contact';


  priceInputElement.disabled =
    isContact;


  if (isContact) {

    priceInputElement.value =
      '';

  }

}


/*
|--------------------------------------------------------------------------
| CREATE SERVICE PRICE TYPE
|--------------------------------------------------------------------------
*/

if (
  servicePriceType &&
  servicePrice
) {

  servicePriceType.addEventListener(
    'change',
    () => {

      updatePriceField(
        servicePriceType,
        servicePrice
      );

    }
  );


  updatePriceField(
    servicePriceType,
    servicePrice
  );

}


/*
|--------------------------------------------------------------------------
| EDIT SERVICE PRICE TYPE
|--------------------------------------------------------------------------
*/

document.addEventListener(
  'change',
  event => {

    const select =
      event.target.closest(
        '.edit-service-price-type'
      );


    if (!select) {

      return;

    }


    const card =
      select.closest(
        '.admin-service-card'
      );


    if (!card) {

      return;

    }


    const priceInput =
      card.querySelector(
        '.edit-service-price'
      );


    updatePriceField(
      select,
      priceInput
    );

  }
);


/*
|--------------------------------------------------------------------------
| REFRESH BUTTONS
|--------------------------------------------------------------------------
*/

if (refreshButton) {

  refreshButton.addEventListener(
    'click',
    loadOrders
  );

}


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
| LOGOUT
|--------------------------------------------------------------------------
*/

if (logoutButton) {

  logoutButton.addEventListener(
    'click',
    () => {

      clearAdminKey();


      currentOrders =
        [];


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
      'TIMIFXX ADMIN DASHBOARD LOADED'
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
