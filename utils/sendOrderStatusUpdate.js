import { createTransport } from "nodemailer";

const sendOrderStatusUpdate = async ({
  email,
  subject,
  orderId,
  products,
  totalAmount,
  status,
}) => {
 const transport = createTransport({
    host: "smtp.gmail.com",
    port: 465,
    auth: {
      user: process.env.Gmail,
      pass: process.env.Password,
    },
  });

  const productsHtml = products
    .map(
      (product) => `
            <tr>
                <td style="padding: 10px; border: 1px solid #ddd;">${product.name}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">${product.quantity}</td>
                <td style="padding: 10px; border: 1px solid #ddd;">₹${product.price}</td>
            </tr>
        `
    )
    .join("");

  const html =  `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Order Status Update</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f9f9f9;
      margin: 0;
      padding: 20px;
    }
    .container {
      background-color: #fff;
      padding: 20px;
      border-radius: 8px;
      max-width: 600px;
      margin: auto;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    h1 {
      color: #2196f3;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      padding: 10px;
      border: 1px solid #ddd;
      text-align: left;
    }
    th {
      background-color: #f2f2f2;
    }
    .status {
      font-size: 18px;
      font-weight: bold;
      color: #4caf50;
    }
    .total {
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Order Update</h1>
    <p>Dear ${email},</p>
    <p>Your order (ID: <strong>${orderId}</strong>) has been updated to:</p>
    <p class="status">${status}</p>
    <table>
      <thead>
        <tr>
          <th>Product</th>
          <th>Quantity</th>
          <th>Price</th>
        </tr>
      </thead>
      <tbody>
        ${productsHtml}
      </tbody>
    </table>
    <p class="total">Total Amount: ₹${totalAmount}</p>
    <p>Thank you for shopping with us!</p>
  </div>
</body>
</html>`;

  await transport.sendMail({
    from: process.env.Gmail,
    to: email,
    subject,
    html,
  });
};

export default sendOrderStatusUpdate;
