import mongoose, {Schema} from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },

    email: {
        type: String,
        required: true,
        unique: true,
    },

    phone: {
        type: String,
        required: true,
        unique: true,
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

    isAdmin : {
        type: Boolean,
        default: false,
    },
    
    isVerified : {
        type: Boolean,
        default: false,
    }
});

userSchema.pre('save', async function(next){
    if(!this.isModified('password')) {
        next();
    }
    //hash the password
    this.password = await bcrypt.hash(this.password, 10);
    next();
})

userSchema.methods.matchPasswords = async function(password){
    if(!password) {
        console.log('No password provided');
        return false;
    }

    const result = await bcrypt.compare(password, this.password);
    return result;
}

userSchema.methods.generateRefreshToken = async function(){
    const refreshToken = jwt.sign(
        {
            id: this._id,
        },
        `${process.env.REFRESH_TOKEN_SECRET}`,
        {
            expiresIn: '7d',
        }
    )
    return refreshToken;
}

userSchema.methods.generateAccessToken = async function(){
    const accessToken = jwt.sign(
        {
            id: this._id,
            name: this.name,
            email: this.email,
        },
        `${process.env.ACCESS_TOKEN_SECRET}`,
        {
            expiresIn: '1d',
        }
    )
    return accessToken;
}

export const User = mongoose.model('User', userSchema); //exporting the model to be used in other files.