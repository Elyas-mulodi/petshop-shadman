import mongoose from "mongoose";

// سفارش پرداخت‌نشده تا این مدت نگه داشته می‌شه؛ بعدش خودکار حذف می‌شه
export const ORDER_HOLD_MS = 24 * 60 * 60 * 1000;

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    variantId: { type: mongoose.Schema.Types.ObjectId, required: true },
    productName: { type: String, required: true }, // اسنپ‌شات از اسم محصول لحظه ثبت سفارش
    attributes: [{ name: String, value: String }],
    image: { type: String, default: null },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true }, // قیمت نهایی (بعد از تخفیف محصول) لحظه ثبت سفارش
    lineTotal: { type: Number, required: true },
  },
  { _id: false },
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    province: { type: String, required: true },
    city: { type: String, required: true },
    addressLine: { type: String, required: true },
    postalCode: { type: String, required: true },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: (arr) => arr.length > 0,
        message: "سفارش باید حداقل یک آیتم داشته باشد",
      },
    },
    shippingAddress: { type: shippingAddressSchema, required: true },

    subtotal: { type: Number, required: true }, // جمع آیتم‌ها قبل از تخفیف سفارش
    shippingCost: { type: Number, required: true, default: 0 },

    discountAmount: { type: Number, default: 0 },
    discountSource: {
      type: String,
      enum: ["coupon", "loyalty", null],
      default: null,
    },
    couponCode: { type: String, default: null },
    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
      default: null,
    },

    totalAmount: { type: Number, required: true }, // subtotal - discountAmount + shippingCost

    status: {
      type: String,
      enum: [
        "pending_payment",
        "paid",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "returned",
      ],
      default: "pending_payment",
    },

    payment: {
      authority: { type: String, default: null },
      refId: { type: String, default: null },
      paidAt: { type: Date, default: null },
    },

    stockDeducted: { type: Boolean, default: false }, // برای جلوگیری از کسر تکراری موجودی

    // مهلت نگه‌داری سفارش پرداخت‌نشده؛ با هر «پرداخت مجدد» تمدید می‌شه
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + ORDER_HOLD_MS),
    },
  },
  { timestamps: true },
);

// حذف خودکار فقط برای سفارش‌های پرداخت‌نشده (TTL جزئی).
// به محض اینکه وضعیت سفارش عوض بشه (پرداخت/لغو)، از این ایندکس بیرون میاد و هرگز حذف نمی‌شه.
orderSchema.index(
  { expiresAt: 1 },
  {
    expireAfterSeconds: 0,
    partialFilterExpression: { status: "pending_payment" },
  },
);

const Order = mongoose.model("Order", orderSchema);
export default Order;
