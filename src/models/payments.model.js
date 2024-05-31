import mongoose from "mongoose";
import slugify from 'slugify'

const paymentSchema = new mongoose.Schema({
    user : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    order : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    total : {
        type: Number,
        required: true
    },

    modeOfPayment : {
        type: String,
        required: true,
        default: "Net Banking"
    }
},
{
    timestamps: true
})

export const Payment = mongoose.model('Payment', paymentSchema)