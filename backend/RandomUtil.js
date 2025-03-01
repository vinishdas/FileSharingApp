// randomUtils.js

// Generate a random alphanumeric string
 function getRandomString(length) {
    let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Generate a random string with 4 letters + 4 numbers
 function getCustomRandomString() {
    let letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    let numbers = "0123456789";

    let randomLetters = "";
    let randomNumbers = "";

    for (let i = 0; i < 4; i++) {
        randomLetters += letters.charAt(Math.floor(Math.random() * letters.length));
        randomNumbers += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }

    return randomLetters + randomNumbers; // Example: "aBcD1234"
}

// Generate a password with rules
  function generatePassword(length) {
    let uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let lowercase = "abcdefghijklmnopqrstuvwxyz";
    let numbers = "0123456789";
    let special = "!@#$%^&*()_+[]{}<>?";

    let allChars = uppercase + lowercase + numbers + special;

    let password = "";
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    password += special.charAt(Math.floor(Math.random() * special.length));

    for (let i = 4; i < length; i++) {
        password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }

    return password.split("").sort(() => Math.random() - 0.5).join(""); // Shuffle password
}

// Generate a coupon code (ABC-123-XYZ)
 function generateCoupon() {
    let letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let numbers = "0123456789";

    function randomSegment(length, charSet) {
        let segment = "";
        for (let i = 0; i < length; i++) {
            segment += charSet.charAt(Math.floor(Math.random() * charSet.length));
        }
        return segment;
    }

    return `${randomSegment(3, letters)}-${randomSegment(3, numbers)}-${randomSegment(3, letters)}`;
}

module.exports = {getRandomString,generateCoupon}