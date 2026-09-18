import mongoose from "mongoose";
import generateSlug from "../../Utils/generateSlug.js";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "نام دسته‌بندی الزامی است"],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    image: {
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

categorySchema.pre("save", async function (next) {
  if (!this.isModified("name")) return next();

  let baseSlug = generateSlug(this.name);
  let slug = baseSlug;
  let counter = 1;

  while (
    await mongoose.models.Category.findOne({ slug, _id: { $ne: this._id } })
  ) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  this.slug = slug;
  next();
});

const Category = mongoose.model("Category", categorySchema);
export default Category;