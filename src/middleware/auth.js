'use strict';

const jwt = require('jsonwebtoken');

// Verifies the JWT issued by andrho-api (HS256, shared secret via JWT_SECRET)
// and attaches the decoded account to the request. andrho-api's token payload
// contract: { sub, email, site_id, company_name, iat, exp }.
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'missing or malformed Authorization header' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    req.account = {
      accountId: payload.sub,
      email: payload.email,
      siteId: payload.site_id,
      companyName: payload.company_name
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'invalid or expired token' });
  }
}

module.exports = { requireAuth };
