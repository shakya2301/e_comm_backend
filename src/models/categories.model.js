import mongoose, {Schema} from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';
import slugify from 'slugify';

const categorySchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    description: {
        type: String,
        required: true,
    }
},
{timestamps: true});

categorySchema.plugin(mongooseAggregatePaginate);
categorySchema.pre('save', function(next){
    const slug = slugify(this.name, {lower: true});
    this.name = slug;
    next();
});

export const Category = mongoose.model('Category', categorySchema);