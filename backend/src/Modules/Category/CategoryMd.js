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
  { timestamps: true },
);

categorySchema.pre("validate", async function () {
  if (!this.isModified("name")) return;

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
});

const Category = mongoose.model("Category", categorySchema);
export default Category;
