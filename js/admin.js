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


const createServiceForm =
  document.getElementById(
    'createServiceForm'
  );


const serviceName =
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
| FORMAT PRICE TYPE
|--------------------------------------------------------------------------
*/

function formatPriceType(
  type
) {

  const types = {

    fixed:
      'Fixed Price',

    starting_from:
      'Starting From',

    contact:
      'Contact Us'

  };


  return (
    types[type] ||
    'Fixed Price'
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


        loginMessage.textContent =
          'Access granted. Loading dashboard...';


        await Promise.all([
          loadOrders(),
          loadServices()
        ]);


        showDashboard();

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


      setTimeout(
        async () => {

          try {

            await loadOrders();

          } catch (error) {

            console.error(
              'Reload error:',
              error
            );

          }

        },
        500
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


    throw error;

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
          No services found. Create your first service above.
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
              : Number(
                  service.price
                );


          return `

            <article
              class="admin-service-card"
              data-service-id="${escapeHtml(
                service.id
              )}"
            >


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

                  <span
                    class="service-active-status ${
                      service.is_active
                        ? 'service-active'
                        : 'service-inactive'
                    }"
                  >
                    ${
                      service.is_active
                        ? 'Active'
                        : 'Inactive'
                    }
                  </span>

                </div>


                <button
                  class="button ghost delete-service-button"
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


              <div class="service-form-grid">


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
                    value="${
                      price === ''
                        ? ''
                        : escapeHtml(
                            price
                          )
                    }"
                  >

                </label>



                <label>

                  Price Type

                  <select
                    class="edit-service-price-type"
                  >

                    ${createPriceTypeOptions(
                      service.price_type
                    )}

                  </select>

                </label>



                <label>

                  Turnaround Time

                  <input
                    class="edit-service-turnaround"
                    type="text"
                    maxlength="150"
                    value="${escapeHtml(
                      service.turnaround_text || ''
                    )}"
                  >

                </label>


              </div>



              <label>

                Service Description

                <textarea
                  class="edit-service-description"
                  rows="5"
                  maxlength="3000"
                >${escapeHtml(
                  service.description || ''
                )}</textarea>

              </label>



              <label class="service-active-label">

                <input
                  class="edit-service-active"
                  type="checkbox"
                  ${
                    service.is_active
                      ? 'checked'
                      : ''
                  }
                >

                <span>
                  This service is active and visible to customers
                </span>

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

              </div>


            </article>

          `;

        }
      )
      .join('');

}


/*
|--------------------------------------------------------------------------
| PRICE TYPE OPTIONS
|--------------------------------------------------------------------------
*/

function createPriceTypeOptions(
  currentType
) {

  const types = [

    'fixed',

    'starting_from',

    'contact'

  ];


  return types
    .map(
      type => `

        <option
          value="${type}"
          ${
            type === currentType
              ? 'selected'
              : ''
          }
        >
          ${formatPriceType(
            type
          )}
        </option>

      `
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
        serviceName.value
          .trim();


      const priceType =
        servicePriceType.value;


      const rawPrice =
        servicePrice.value
          .trim();


      let price =
        rawPrice === ''
          ? null
          : Number(
              rawPrice
            );


      if (
        priceType === 'contact'
      ) {

        price =
          null;

      }


      if (
        !name
      ) {

        serviceMessage.textContent =
          'Enter a service name.';

        return;

      }


      if (
        priceType !== 'contact' &&
        (
          price === null ||
          !Number.isFinite(
            price
          ) ||
          price < 0
        )
      ) {

        serviceMessage.textContent =
          'Enter a valid price.';

        return;

      }


      const originalText =
        createServiceButton.textContent;


      createServiceButton.disabled =
        true;


      createServiceButton.textContent =
        'Creating...';


      if (serviceMessage) {

        serviceMessage.textContent =
          '';

      }


      try {

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


        servicePriceType.value =
          'fixed';


        if (serviceMessage) {

          serviceMessage.textContent =
            'Service created successfully.';

        }


        await loadServices();


        createServiceButton.textContent =
          'Created!';


        setTimeout(
          () => {

            createServiceButton.disabled =
              false;

            createServiceButton.textContent =
              originalText;

          },
          700
        );

      } catch (error) {

        console.error(
          'Create service error:',
          error
        );


        createServiceButton.disabled =
          false;


        createServiceButton.textContent =
          originalText;


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


    const name =
      card
        .querySelector(
          '.edit-service-name'
        )
        .value
        .trim();


    const priceInput =
      card.querySelector(
        '.edit-service-price'
      );


    const priceType =
      card
        .querySelector(
          '.edit-service-price-type'
        )
        .value;


    const description =
      card
        .querySelector(
          '.edit-service-description'
        )
        .value
        .trim();


    const turnaround =
      card
        .querySelector(
          '.edit-service-turnaround'
        )
        .value
        .trim();


    const isActive =
      card
        .querySelector(
          '.edit-service-active'
        )
        .checked;


    let price =
      priceInput.value === ''
        ? null
        : Number(
            priceInput.value
          );


    if (
      priceType === 'contact'
    ) {

      price =
        null;

    }


    if (!name) {

      if (serviceMessage) {

        serviceMessage.textContent =
          'Service name cannot be empty.';

      }

      return;

    }


    if (
      priceType !== 'contact' &&
      (
        price === null ||
        !Number.isFinite(
          price
        ) ||
        price < 0
      )
    ) {

      if (serviceMessage) {

        serviceMessage.textContent =
          'Enter a valid service price.';

      }

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
          `/api/admin/services/${encodeURIComponent(
            serviceId
          )}`,
          {

            method:
              'PATCH',

            body:
              JSON.stringify({

                name,

                description,

                price,

                price_type:
                  priceType,

                turnaround_text:
                  turnaround,

                is_active:
                  isActive

              })

          }
        );


      button.textContent =
        'Saved!';


      if (serviceMessage) {

        serviceMessage.textContent =
          `${data.service.name} updated successfully.`;

      }


      await loadServices();


      setTimeout(
        () => {

          button.disabled =
            false;

          button.textContent =
            originalText;

        },
        700
      );

    } catch (error) {

      console.error(
        'Update service error:',
        error
      );


      button.disabled =
        false;


      button.textContent =
        originalText;


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
      button.dataset.serviceName ||
      'this service';


    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${serviceName}"?`
      );


    if (!confirmed) {
      return;
    }


    const originalText =
      button.textContent;


    button.disabled =
      true;


    button.textContent =
      'Deleting...';


    try {

      const data =
        await adminFetch(
          `/api/admin/services/${encodeURIComponent(
            serviceId
          )}`,
          {

            method:
              'DELETE'

          }
        );


      if (serviceMessage) {

        serviceMessage.textContent =
          `${data.service.name} deleted successfully.`;

      }


      await loadServices();

    } catch (error) {

      console.error(
        'Delete service error:',
        error
      );


      button.disabled =
        false;


      button.textContent =
        originalText;


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
| REFRESH ORDERS
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
| REFRESH SERVICES
|--------------------------------------------------------------------------
*/

if (refreshServicesButton) {

  refreshServicesButton.addEventListener(
    'click',
    () => {

      loadServices()
        .catch(
          error => {

            console.error(
              'Refresh services error:',
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


      await Promise.all([
        loadOrders(),
        loadServices()
      ]);


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
