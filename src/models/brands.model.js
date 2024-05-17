import mongoose, {Schema} from "mongoose";
import slugify from "slugify";

const brandSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    logo: {
        type: String,
        required: true
    },
    
},
{
    timestamps: true
});

brandSchema.pre('save' , function(next){
    this.name = slugify(this.name, {lower: true});
    next();
})

export const Brand = mongoose.model('Brand', brandSchema);