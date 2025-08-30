module.exports = function publicUser(decoded) {
    const { username, exp } = decoded || {};
    return { username, exp };
};