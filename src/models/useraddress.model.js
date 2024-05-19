import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const userAddressSchema = new Schema({
    user : {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    addressLine1 : {
        type:String,
        required:true
    },
    addressLine2 : {
        type:String
    },
    city : {
        type:String
    },
    state : {
        type:String
    },
    country : {
        type:String
    }
})

userAddressSchema.plugin(mongooseAggregatePaginate);

export const Useraddress = mongoose.model('Useraddress', userAddressSchema);