import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(__dirname, '../../.env') })

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-minimum-32-characters-long'
process.env.DEMO_MODE = process.env.DEMO_MODE || 'true'
process.env.PAYMENT_MOCK_MODE = 'true'
process.env.ADMIN_2FA_REQUIRED = 'false'
