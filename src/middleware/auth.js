'use strict';

const jwt = require('jsonwebtoken');

// Verifies the JWT issued by andrho-api (HS256, shared secret via JWT_SECRET)
// and attaches the decoded account to the request. andrho-api's token payload
// contract (post multi-user/roles migration): { sub, account_id, email,
// site_id, company_name, role, iat, exp }. `sub` is the *user* id -- the
// account/tenant id is the separate `account_id` claim. Neither is used by
// this Express app's own routes today (src/routes/api.js only checks
// siteId), but both are attached here for anything that needs them.
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'missing or malformed Authorization header' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    req.account = {
      userId: payload.sub,
      accountId: payload.account_id,
      email: payload.email,
      siteId: payload.site_id,
      companyName: payload.company_name,
      role: payload.role
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'invalid or expired token' });
  }
}

module.exports = { requireAuth };
