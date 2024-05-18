import mongoose, {Schema} from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const ratingsSchema = new Schema(
    {
        rating : {
            type: Number,
            required: true,
            default: 0,
            min: 0,
            max: 5,
            validate: {
                validator: function(value){
                    return (value<=5 && value>=0);
                },
                message: 'Rating should be between 0 and 5'
            }
        },

        review: {
            type: String,
            required: false,
            default: null
        },

        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },

        product: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },

        isAnonymous: {
            type: Boolean,
            default: false
        }
    }
)

ratingsSchema.plugin(mongooseAggregatePaginate);

export const Rating = mongoose.model('Rating', ratingsSchema);