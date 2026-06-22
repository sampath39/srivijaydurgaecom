const express = require('express')
const router = express.Router()
const { body, query, validationResult } = require('express-validator')
const { supabase } = require('../server') // Supabase client is initialized in server.js, wait I should use a local instance or pg.
