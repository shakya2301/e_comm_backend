import mongoose, {Schema} from 'mongoose';
import mongooseaggregatePaginate from 'mongoose-aggregate-paginate-v2';
import slugify from 'slugify';

const subCategorySchema = new Schema(
    {
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        category: {
            type: Schema.Types.ObjectId,
            ref: 'Category',
            required: true,
        }
    },
    {
        timestamps: true
    }
);
subCategorySchema.plugin(mongooseaggregatePaginate);

subCategorySchema.pre('save', function(next){
    const slug = slugify(this.name, {lower: true});
    this.name = slug;
    next();
});

export const Subcategory = mongoose.model('SubCategory', subCategorySchema);