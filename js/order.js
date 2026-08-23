const API_BASE_URL =
  window.TIMIFXX_API_BASE_URL ||
  document.querySelector(
    'meta[name="api-base-url"]'
  )?.content ||
  'https://timifxx-marketing-production.up.railway.app';


function apiUrl(path) {

  return (
    `${API_BASE_URL.replace(/\/$/, '')}${path}`
  );

}


/*
|--------------------------------------------------------------------------
| TELEGRAM
|--------------------------------------------------------------------------
*/

const TELEGRAM_USERNAME =
  'timifxx203';


/*
|--------------------------------------------------------------------------
| ELEMENTS
|--------------------------------------------------------------------------
*/

const serviceSelect =
  document.getElementById(
    'serviceId'
  );


const form =
  document.getElementById(
    'orderForm'
  );


const formMessage =
  document.getElementById(
    'formMessage'
  );


const submitButton =
  document.getElementById(
    'submitButton'
  );


/*
|--------------------------------------------------------------------------
| LOAD SERVICES
|--------------------------------------------------------------------------
*/

async function loadServices() {

  if (!serviceSelect) {
    return;
  }


  try {

    const response =
      await fetch(
        apiUrl('/api/services'),
        {
          method: 'GET',

          headers: {
            Accept: 'application/json'
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


    serviceSelect.innerHTML =
      '<option value="">Select a service</option>';


    if (
      services.length === 0
    ) {

      serviceSelect.innerHTML =
        '<option value="">No services available</option>';

      return;

    }


    for (
      const service of services
    ) {

      const option =
        document.createElement(
          'option'
        );


      const price =
        Number(
          service.price
        );


      const priceText =
        service.price_type ===
        'starting_from'
          ? `Starting from $${price.toFixed(0)}`
          : `$${price.toFixed(0)}`;


      option.value =
        service.id;


      option.textContent =
        `${service.name} — ${priceText}`;


      serviceSelect.appendChild(
        option
      );

    }


    /*
    |--------------------------------------------------------------------------
    | PRESELECT SERVICE
    |--------------------------------------------------------------------------
    */

    const requestedService =
      new URLSearchParams(
        window.location.search
      ).get(
        'service'
      );


    if (
      requestedService
    ) {

      serviceSelect.value =
        requestedService;

    }

  } catch (error) {

    console.error(
      'Service loading error:',
      error
    );


    serviceSelect.innerHTML =
      '<option value="">Unable to load services</option>';


    if (
      formMessage
    ) {

      formMessage.textContent =
        'Unable to load services. Please refresh the page.';

    }

  }

}


/*
|--------------------------------------------------------------------------
| CREATE TELEGRAM MESSAGE
|--------------------------------------------------------------------------
*/

function createTelegramMessage(
  order
) {

  const orderNumber =
    order.order_number ||
    order.orderNumber ||
    'Not available';


  const serviceName =
    order.service_name ||
    order.serviceName ||
    'Not available';


  const orderStatus =
    order.status ||
    'pending';


  const orderPrice =
    order.price
      ? `$${Number(order.price).toFixed(2)} USD`
      : 'Not available';


  const telegramMessage = [

    'Hello TimiFxx Marketing!',

    '',

    'I have created a new order.',

    '',

    `Order Number: ${orderNumber}`,

    '',

    `Service: ${serviceName}`,

    '',

    `Price: ${orderPrice}`,

    '',

    `Order Status: ${orderStatus}`,

    '',

    'Please let me know the next step to finalize my order.'

  ]
    .join('\n');


  return telegramMessage;

}


/*
|--------------------------------------------------------------------------
| ORDER SUBMISSION
|--------------------------------------------------------------------------
*/

if (
  form
) {

  form.addEventListener(
    'submit',
    async function (
      event
    ) {

      event.preventDefault();


      if (
        !formMessage
      ) {

        return;

      }


      const serviceId =
        serviceSelect.value;


      const name =
        document.getElementById(
          'name'
        ).value.trim();


      const email =
        document.getElementById(
          'email'
        ).value.trim();


      const telegramUsername =
        document.getElementById(
          'telegramUsername'
        ).value.trim();


      const whatsapp =
        document.getElementById(
          'whatsapp'
        ).value.trim();


      const message =
        document.getElementById(
          'message'
        ).value.trim();


      formMessage.textContent =
        'Creating your order...';


      if (
        submitButton
      ) {

        submitButton.disabled =
          true;


        submitButton.textContent =
          'Creating Order...';

      }


      try {

        const response =
          await fetch(
            apiUrl('/api/orders'),
            {

              method:
                'POST',

              headers: {

                'Content-Type':
                  'application/json',

                Accept:
                  'application/json'

              },

              body:
                JSON.stringify({

                  serviceId:
                    Number(
                      serviceId
                    ),

                  name,

                  email,

                  telegramUsername,

                  whatsapp,

                  message

                })

            }
          );


        const data =
          await response.json();


        console.log(
          'Order API response:',
          data
        );


        if (
          !response.ok ||
          !data.success
        ) {

          throw new Error(
            data.message ||
            'Unable to create your order.'
          );

        }


        /*
        |--------------------------------------------------------------------------
        | GET ORDER DATA
        |--------------------------------------------------------------------------
        */

        const order =
          data.order ||
          {};


        const orderNumber =
          order.order_number ||
          order.orderNumber;


        const serviceName =
          order.service_name ||
          order.serviceName ||
          serviceSelect.options[
            serviceSelect.selectedIndex
          ].textContent;


        if (
          !orderNumber
        ) {

          throw new Error(
            'Order was created but no order number was returned.'
          );

        }


        /*
        |--------------------------------------------------------------------------
        | SUCCESS MESSAGE
        |--------------------------------------------------------------------------
        */

        formMessage.textContent =
          `Order created successfully. Your order number is ${orderNumber}. Redirecting you to Telegram...`;


        /*
        |--------------------------------------------------------------------------
        | PREPARE TELEGRAM ORDER DATA
        |--------------------------------------------------------------------------
        */

        const telegramOrder = {

          order_number:
            orderNumber,

          service_name:
            serviceName,

          price:
            order.price,

          status:
            order.status ||
            'pending'

        };


        const telegramMessage =
          createTelegramMessage(
            telegramOrder
          );


        const telegramUrl =
          `https://t.me/${TELEGRAM_USERNAME}?text=${encodeURIComponent(
            telegramMessage
          )}`;


        /*
        |--------------------------------------------------------------------------
        | REDIRECT TO TELEGRAM
        |--------------------------------------------------------------------------
        */

        window.setTimeout(
          function () {

            window.location.href =
              telegramUrl;

          },
          1500
        );

      } catch (
        error
      ) {

        console.error(
          'Order creation error:',
          error
        );


        formMessage.textContent =
          error.message ||
          'Unable to create your order. Please try again.';


        if (
          submitButton
        ) {

          submitButton.disabled =
            false;


          submitButton.textContent =
            'Submit Order';

        }

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
  loadServices
);
