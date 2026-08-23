const API_BASE_URL =
  window.TIMIFXX_API_BASE_URL ||
  document.querySelector(
    'meta[name="api-base-url"]'
  )?.content ||
  'https://timifxx-marketing-production.up.railway.app';


function apiUrl(path) {

  return `${API_BASE_URL.replace(
    /\/$/,
    ''
  )}${path}`;

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

function escapeHtml(value) {

  return String(value)
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
| ORDER NUMBER VALIDATION
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
      function (letter) {

        return letter.toUpperCase();

      }
    );

}


/*
|--------------------------------------------------------------------------
| FORMAT DATE
|--------------------------------------------------------------------------
*/

function formatDate(dateValue) {

  const date =
    new Date(dateValue);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return 'Unavailable';

  }


  return date.toLocaleString();

}


/*
|--------------------------------------------------------------------------
| SHOW MESSAGE
|--------------------------------------------------------------------------
*/

function showMessage(
  text
) {

  result.hidden = false;

  result.textContent =
    text;

}


/*
|--------------------------------------------------------------------------
| SHOW ORDER
|--------------------------------------------------------------------------
*/

function showOrder(
  order
) {

  const price =
    Number(
      order.price
    );


  const formattedPrice =
    Number.isFinite(price)
      ? `$${price.toFixed(2)}`
      : 'Unavailable';


  result.hidden = false;


  result.innerHTML = `

    <div class="status-result-header">

      <span class="status-label">
        Order Status
      </span>

      <span class="status-badge status-${escapeHtml(
        order.status
      )}">

        ${escapeHtml(
          formatStatus(
            order.status
          )
        )}

      </span>

    </div>


    <div class="status-details">

      <div class="status-item">

        <span>
          Order Number
        </span>

        <strong>
          ${escapeHtml(
            order.order_number
          )}
        </strong>

      </div>


      <div class="status-item">

        <span>
          Service
        </span>

        <strong>
          ${escapeHtml(
            order.service_name
          )}
        </strong>

      </div>


      <div class="status-item">

        <span>
          Price
        </span>

        <strong>
          ${formattedPrice}
        </strong>

      </div>


      <div class="status-item">

        <span>
          Created
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


      input.value =
        orderNumber;


      if (
        !isValidOrderNumber(
          orderNumber
        )
      ) {

        showMessage(
          'Please enter a valid order number. Example: TMF-2026-123456'
        );

        return;

      }


      showMessage(
        'Checking your order...'
      );


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


        let data;


        try {

          data =
            await response.json();

        } catch (error) {

          throw new Error(
            'Invalid server response.'
          );

        }


        if (!response.ok) {

          showMessage(
            data.message ||
            'Order not found.'
          );

          return;

        }


        if (
          !data.success ||
          !data.order
        ) {

          showMessage(
            'Order information could not be loaded.'
          );

          return;

        }


        showOrder(
          data.order
        );


      } catch (error) {

        console.error(
          'Order tracking error:',
          error
        );


        showMessage(
          'Unable to check your order status. Please try again.'
        );

      }

    }
  );

}


/*
|--------------------------------------------------------------------------
| LOAD ORDER NUMBER FROM URL
|--------------------------------------------------------------------------
*/

document.addEventListener(
  'DOMContentLoaded',
  function () {

    const requestedOrder =
      new URLSearchParams(
        window.location.search
      ).get(
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
