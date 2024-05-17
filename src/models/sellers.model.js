import mongoose, {Schema} from 'mongoose'
import asyncHandler from '../utils/asyncHandler.js';
import bcrypt from 'bcrypt';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const sellerSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },
        email: {
            type: String,
            required: true,
            lowercase: true
        },
        phone: {
            type: String,
            required: true,
            lowercase: true
        },
        password: {
            type: String,
            required: true,
        },
        pfp: {
            type: String,
            required: false,
        },
        refreshToken : {
            type: String,
        },
        GSTIN : {
            type: String,
            required: true,
        },
        isVerified : {
            type: Boolean,
            default: false,
        },
        niche: [{
            type: Schema.Types.ObjectId,
            required: true,
            trim: true,
            lowercase: true
        }],

        isAuthorized: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
)

sellerSchema.plugin(mongooseAggregatePaginate);

sellerSchema.pre('save', async function(next){
    if(!this.isModified('password')) {
        return next();
    }
    //hash the password
    this.password = await bcrypt.hash(this.password, 10);
    return next();
})

sellerSchema.pre('save', function(next) {

    if(!this.niche || this.niche.length === 0) {
        console.log('No niche provided');
        return next();
    }
    console.log(this.niche);
    next();
});

sellerSchema.methods.matchPasswords = async function(password){
    if(!password) {
        console.log('No password provided');
        return false;
    }

    const result = await bcrypt.compare(password, this.password);
    return result;
}

export const Seller = mongoose.model('Seller', sellerSchema);