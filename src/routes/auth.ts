import express, { type Request, type Response, type Router } from "express";
import { AuthResponse } from "../types"
import {  type IUser, User } from "../models/users";
import { type IRequestInput, type ILoginInput } from "../types/types";
import bcrypt from "bcrypt";
import Joi from 'joi';
import auth from "../middleware/auth";

const router: Router = express.Router();

/** ------- GET ------ */

router.get("/me", auth, async (req: Request, res: Response) => {
        const id = (req.user as AuthResponse)._id;

        const user = await User.findById(id).select("-passwordHash");

        res.send(user);
});

/** ------- POST ------ */

router.post("/register", async (req: Request, res: Response) => {
    const { error } = validateUser(req.body);
    if(error) {
        return res.status(400).json({error: error.details[0].message});
    }

    let user: IUser | null = await User.findOne({email: req.body.email});
    if(user) {
        return res.status(400).json({error: "User already registered"});
    }

    const salt: string = await bcrypt.genSalt(10);
    const hashedPassword: string = await bcrypt.hash(req.body.password, salt);

    user = await User.create({
        name: req.body.name,
        email: req.body.email,
        passwordHash: hashedPassword,
        role: "student"
    });

    const token = await user.generateAuthToken();

    res.header("x-auth-token", token).json({name: user.name, email: user.email});
});

router.post("/login", async(req: Request, res: Response) => {
    const { error } = validateLogin(req.body);
    if(error) {
        return res.status(400).json({error: error.details[0].message});
    }

    let user: IUser | null = await User.findOne({email: req.body.email});
    if(!user) {
        return res.status(400).json({error: "Invalid email or password"});
    }

    const validPassword: boolean = await bcrypt.compare(req.body.password, user.passwordHash);
    if(!validPassword) {
        return res.status(400).json({error: "Invalid email or password"});
    }

    const token = await user.generateAuthToken();

    res.header("x-auth-token", token).json({email: user.email});
});

export default router;

const validateUser = (user: IRequestInput) => {
    const schema = Joi.object({
        name: Joi.string().required().min(3).max(255),
        email: Joi.string().required().min(3).max(255).email(),
        password: Joi.string().required().min(6)
    });

    return schema.validate(user);
}

const validateLogin = (login: ILoginInput) => {
    const schema = Joi.object({
        email: Joi.string().required().min(3).max(255).email(),
        password: Joi.string().required().min(6)
    });

    return schema.validate(login);
}
