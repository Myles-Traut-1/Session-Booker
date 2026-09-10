import express, { type Request, type Response, type Router } from "express";
import {  type IUser, User } from "../models/users";
import { type IRequestInput } from "../types/types";
import bcrypt from "bcrypt";
import Joi from 'joi';

const router: Router = express.Router();

router.post("/register", async (req: Request, res: Response) => {
    const { error } = validateUser(req.body);
    if(error) {
        return res.status(400).json({error: "Bad Request"});
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

export default router;

const validateUser = (user: IRequestInput) => {
    const schema = Joi.object({
        name: Joi.string().required().min(3).max(255),
        email: Joi.string().required().min(3).max(255).email(),
        password: Joi.string().required().min(6)
    });

    return schema.validate(user);
}
