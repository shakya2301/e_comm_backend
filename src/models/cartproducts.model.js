import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const cartProductsSchema = new Schema({
  cart: {
    type: Schema.Types.ObjectId,
    ref: "Cart",
    required: true,
  },
  product: {
    type: Schema.Types.ObjectId,
    ref: "Product",
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
  },
});

cartProductsSchema.plugin(mongooseAggregatePaginate);

// cartProductsSchema.pre("save", function (next) {
//   if (this.quantity <= 0) {
//     this.deleteOne();
//   }
//   next();
// });

// cartProductsSchema.pre("update", function (next) {
//   const quantity = this.getUpdate().$set.quantity;
//   if (quantity <= 0) {
//     this.deleteOne();
//   }
//   next();
// });

export const Cartproduct = mongoose.model("Cartproduct", cartProductsSchema);
