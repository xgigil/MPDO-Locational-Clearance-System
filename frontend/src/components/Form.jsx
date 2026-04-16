// For Login and Register forms, which are used in the Login and Register pages respectively
import {useState} from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants"; 

function Form({})
