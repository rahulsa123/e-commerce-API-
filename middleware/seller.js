module.exports = (req, res, next) => {
  // inavlid user
  if (!(req.user && req.user.seller))
    return res.status("403").json({
      error: "User is not a seller",
    });
  next();
};
