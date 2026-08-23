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

const form =
  document.getElementById(
    'trackingForm'
  );


const input =
  document.getElementById(
    'orderNumber'
  );


const result =
  document.getElementById(
    'statusResult'
  );


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
| VALIDATE ORDER NUMBER
|--------------------------------------------------------------------------
*/

function isValidOrderNumber(
  orderNumber
) {

  return /^TMF-\d{4}-\d{6}$/.test(
    orderNumber
  );

}


/*
|--------------------------------------------------------------------------
| FORMAT DATE
|--------------------------------------------------------------------------
*/

function formatDate(
  value
) {

  if (!value) {

    return 'Unknown';

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

    return 'Unknown';

  }


  return date.toLocaleString();

}


/*
|--------------------------------------------------------------------------
| RENDER HISTORY
|--------------------------------------------------------------------------
*/

function renderHistory(
  history
) {

  if (
    !Array.isArray(history) ||
    history.length === 0
  ) {

    return `
      <div class="status-history-empty">
        No status updates yet.
      </div>
    `;

  }


  return `

    <div class="status-history">

      <h2>
        Order Updates
      </h2>

      ${history
        .map(
          item => `

            <div class="status-history-item">

              <div class="status-history-status">

                ${escapeHtml(
                  formatStatus(
                    item.new_status
                  )
                )}

              </div>


              <p>

                ${escapeHtml(
                  item.note ||
                  'Order status updated.'
                )}

              </p>


              <time>

                ${escapeHtml(
                  formatDate(
                    item.created_at
                  )
                )}

              </time>

            </div>

          `
        )
        .join(
          ''
        )}

    </div>

  `;

}


/*
|--------------------------------------------------------------------------
| RENDER ORDER
|--------------------------------------------------------------------------
*/

function renderOrder(
  order,
  history
) {

  result.innerHTML = `

    <div class="current-order-status">

      <div>

        <span>
          Current Status
        </span>

        <strong
          class="tracking-status tracking-status-${escapeHtml(
            order.status
          )}"
        >

          ${escapeHtml(
            formatStatus(
              order.status
            )
          )}

        </strong>

      </div>

    </div>


    <div class="order-summary">

      <div>

        <span>
          Order Number
        </span>

        <strong>
          ${escapeHtml(
            order.order_number
          )}
        </strong>

      </div>


      <div>

        <span>
          Service
        </span>

        <strong>
          ${escapeHtml(
            order.service_name
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
          Order Created
        </span>

        <strong>
          ${escapeHtml(
            formatDate(
              order.created_at
            )
          )}
        </strong>

      </div>

    </div>


    ${renderHistory(
      history
    )}

  `;

}


/*
|--------------------------------------------------------------------------
| TRACK ORDER
|--------------------------------------------------------------------------
*/

if (form) {

  form.addEventListener(
    'submit',

    async function (
      event
    ) {

      event.preventDefault();


      const orderNumber =
        input.value
          .trim()
          .toUpperCase();


      if (
        !isValidOrderNumber(
          orderNumber
        )
      ) {

        result.hidden =
          false;


        result.textContent =
          'Invalid order number.';

        return;

      }


      result.hidden =
        false;


      result.textContent =
        'Checking order...';


      try {

        const response =
          await fetch(
            apiUrl(
              `/api/orders/status/${encodeURIComponent(
                orderNumber
              )}`
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


        const data =
          await response
            .json()
            .catch(
              () => ({})
            );


        if (
          !response.ok
        ) {

          result.textContent =
            data.message ||
            'Order not found.';

          return;

        }


        renderOrder(
          data.order,
          data.history
        );

      } catch (
        error
      ) {

        console.error(
          'Order tracking error:',
          error
        );


        result.textContent =
          'Unable to check order status. Please try again.';

      }

    }
  );

}


/*
|--------------------------------------------------------------------------
| OPTIONAL ORDER NUMBER FROM URL
|--------------------------------------------------------------------------
*/

document.addEventListener(
  'DOMContentLoaded',

  function () {

    const requestedOrder =
      new URLSearchParams(
        window.location.search
      )
        .get(
          'order'
        );


    if (
      requestedOrder &&
      input
    ) {

      input.value =
        requestedOrder
          .trim()
          .toUpperCase();

    }

  }
);
