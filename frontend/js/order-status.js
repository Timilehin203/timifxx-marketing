const API_BASE_URL =
  window.TIMIFXX_API_BASE_URL ||
  document.querySelector('meta[name="api-base-url"]')?.content ||
  '';

function apiUrl(path) {
  return `${API_BASE_URL.replace(/\/$/, '')}${path}`;
}


/*
|--------------------------------------------------------------------------
| ELEMENTS
|--------------------------------------------------------------------------
*/

const form =
  document.getElementById('trackingForm');

const input =
  document.getElementById('orderNumber');

const result =
  document.getElementById('statusResult');


/*
|--------------------------------------------------------------------------
| ESCAPE HTML
|--------------------------------------------------------------------------
*/

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
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
| TRACK ORDER
|--------------------------------------------------------------------------
*/

if (form) {

  form.addEventListener(
    'submit',
    async function (event) {

      event.preventDefault();


      const orderNumber =
        input.value
          .trim()
          .toUpperCase();


      if (!isValidOrderNumber(orderNumber)) {

        result.hidden = false;

        result.textContent =
          'Invalid order number.';

        return;
      }


      result.hidden = false;

      result.textContent =
        'Checking order...';


      try {

        const response = await fetch(
          apiUrl(
            `/api/orders/status/${encodeURIComponent(orderNumber)}`
          ),
          {
            method: 'GET',
            headers: {
              Accept: 'application/json'
            }
          }
        );


        const data =
          await response.json();


        if (!response.ok) {

          result.textContent =
            data.message ||
            'Order not found.';

          return;
        }


        const order =
          data.order;


        result.innerHTML = `

          <strong>
            Order:
          </strong>

          ${escapeHtml(order.order_number)}

          <br>


          <strong>
            Service:
          </strong>

          ${escapeHtml(order.service_name)}

          <br>


          <strong>
            Status:
          </strong>

          ${escapeHtml(order.status)}

          <br>


          <strong>
            Price:
          </strong>

          $${Number(order.price).toFixed(2)}

          <br>


          <strong>
            Created:
          </strong>

          ${new Date(
            order.created_at
          ).toLocaleString()}

        `;

      } catch (error) {

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
| START
|--------------------------------------------------------------------------
*/

document.addEventListener(
  'DOMContentLoaded',
  function () {

    /*
    |--------------------------------------------------------------------------
    | Optional order number from URL
    |--------------------------------------------------------------------------
    */

    const requestedOrder =
      new URLSearchParams(
        window.location.search
      ).get('order');


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
