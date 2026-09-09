import express, { type Request, type Response, type Router } from "express";
import mongoose from "mongoose";
import {  type IUser, User, UserRole } from "../models/users";
import bcrypt from "bcrypt";
import Joi from 'joi';


const router: Router = express.Router();

router.post("/register", async (req: Request, res: Response) => {
    let user: IUser | null = await User.findOne({email: req.body.email});
    if(user) {
        return res.status(400).send("User already registered");
    }

    const { error } = validateUser(req.body);
    if(error) {
        return res.status(400).send("Bad Request");
    }

    const salt: string = await bcrypt.genSalt(10);
    const hashedPassword: string = await bcrypt.hash(req.body.password, salt);

    user = await User.create({
        name: req.body.name,
        email: req.body.email,
        passwordHash: hashedPassword,
        role: "student",
        createdAt: Date.now(),
        updatedAt: Date.now()
    });

    const token = await user.generateAuthToken();

    res.header("x-auth-token", token).send({name: user.name, email: user.email});

});

export default router;

const validateUser = (user: IUser) => {
    const schema = Joi.object({
        name: Joi.string().required().min(3).max(255),
        email: Joi.string().required().min(3).max(255).email(),
        password: Joi.string().required().min(6)
    });

    return schema.validate(user);
}
