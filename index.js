require('dotenv').config()

const Express = require('express')
const puppeteer = require('puppeteer')
const Upstox = require('upstox')
const url = require('url')

const worker = async ({
    username,
    password,
    dob,
    api_key,
    redir_url,
}) => {
    console.log('Worker starting...')
    
    var upstox = new Upstox(api_key)
    var login_url = upstox.getLoginUri(redir_url)


	const browser = await puppeteer.launch({ headless: true, timeout:0, args: ['--no-sandbox', '--disable-setuid-sandbox'] })
	const page = await browser.newPage()
	const keyboard = page.keyboard

    var focusNtype = async function (selector, text=''){
        await page.focus(selector)
        await keyboard.type(text)
    }

    await page.goto(login_url)

    await focusNtype('#name', username)
    await focusNtype('[name="password"]', password)
    await focusNtype('[name="password2fa"]', dob)
    await page.click("body > form > fieldset > div.bottom-box > div > button")
    console.log('Login done')

    await page.waitForNavigation()

    await page.click('#allow')
    console.log('Allow clicked')

    await page.waitForNavigation()

    var codeUrlParsed = url.parse(page.url(), true)
    var code = codeUrlParsed.query.code

    browser.close()

    return code
}

// APP
const port = process.env.PORT
const app = Express()
app.listen(port, () => console.log(`Listening on port ${port}.`))

app.get('/', async function(req, res) {
    var username = req.query.u || ''
    var password = req.query.p || ''
    var dob      = req.query.d || ''
    var api_key  = req.query.a || ''
    var redir_url= req.query.r || 'https://en.wikipedia.org/wiki/Sensex'

    try {
        var code = await worker({
            username,
            password,
            dob,
            api_key,
            redir_url,
        })
        res.send(code)
    } catch (error) {
        console.error(error)
        res.status(500).send(error.message)
    }
})
