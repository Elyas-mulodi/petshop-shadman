import mongoose from "mongoose";
import generateSlug from "../../Utils/generateSlug.js";

const variantAttributeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const variantSchema = new mongoose.Schema({
  attributes: {
    type: [variantAttributeSchema],
    validate: {
      validator: (arr) => arr.length > 0,
      message: "هر واریانت باید حداقل یک ویژگی داشته باشد",
    },
  },
  price: {
    type: Number,
    required: [true, "قیمت واریانت الزامی است"],
    min: [0, "قیمت نمی‌تواند منفی باشد"],
  },
  stock: {
    type: Number,
    required: [true, "موجودی واریانت الزامی است"],
    min: [0, "موجودی نمی‌تواند منفی باشد"],
    default: 0,
  },
  sku: {
    type: String,
    unique: true,
    sparse: true,
  },
});

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "نام محصول الزامی است"],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: [true, "توضیحات محصول الزامی است"],
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: [true, "برند محصول الزامی است"],
    },
    categories: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
      validate: {
        validator: (arr) => arr.length > 0,
        message: "محصول باید حداقل یک دسته‌بندی داشته باشد",
      },
    },
    images: {
      type: [String],
      default: [],
    },
    variants: {
      type: [variantSchema],
      validate: {
        validator: (arr) => arr.length > 0,
        message: "محصول باید حداقل یک واریانت داشته باشد",
      },
    },
    discountPercent: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    discountStartDate: {
      type: Date,
      default: null,
    },
    discountEndDate: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// ساخت خودکار slug — باید قبل از validation اجرا بشه چون slug الزامیه
productSchema.pre("validate", async function () {
  if (!this.isModified("name")) return;

  let baseSlug = generateSlug(this.name);
  let slug = baseSlug;
  let counter = 1;

  while (
    await mongoose.models.Product.findOne({ slug, _id: { $ne: this._id } })
  ) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  this.slug = slug;
});

// ساخت خودکار SKU برای واریانت‌هایی که SKU ندارن
productSchema.pre("save", async function () {
  this.variants.forEach((variant, index) => {
    if (!variant.sku) {
      const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
      variant.sku = `${this.slug || "PRD"}-${index + 1}-${randomPart}`;
    }
  });
});

productSchema.methods.isDiscountActive = function () {
  if (!this.discountPercent || this.discountPercent <= 0) return false;
  const now = new Date();
  if (this.discountStartDate && now < this.discountStartDate) return false;
  if (this.discountEndDate && now > this.discountEndDate) return false;
  return true;
};

productSchema.virtual("priceRange").get(function () {
  const prices = this.variants.map((v) => v.price);
  return { min: Math.min(...prices), max: Math.max(...prices) };
});

productSchema.set("toJSON", { virtuals: true });

const Product = mongoose.model("Product", productSchema);
export default Product;