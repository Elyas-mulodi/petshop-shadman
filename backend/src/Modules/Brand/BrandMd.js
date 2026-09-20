import mongoose from "mongoose";
import generateSlug from "../../Utils/generateSlug.js";

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "نام برند الزامی است"],
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    logo: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

brandSchema.pre("save", async function (next) {
  if (!this.isModified("name")) return next();

  let baseSlug = generateSlug(this.name);
  let slug = baseSlug;
  let counter = 1;

  while (
    await mongoose.models.Brand.findOne({ slug, _id: { $ne: this._id } })
  ) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  this.slug = slug;
  next();
});

const Brand = mongoose.model("Brand", brandSchema);
export default Brand;