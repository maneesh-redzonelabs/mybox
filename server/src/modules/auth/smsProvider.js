/**
 * Swappable SMS provider interface. The mock implementation just console.logs,
 * mirroring MOCK_OTP behavior in MyBox.html but with real persistence (see otpService.js).
 */
class ConsoleSmsProvider {
  async send(mobile, otp) {
    console.log(`[sms] OTP for ${mobile}: ${otp}`);
    return true;
  }
}

module.exports = { ConsoleSmsProvider };
