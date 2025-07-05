const MoneyBackInsurance = artifacts.require("MoneyBackInsurance");
const TermLifeInsurance = artifacts.require("TermLifeInsurance");

module.exports = function (deployer) {
  deployer.deploy(MoneyBackInsurance);
  deployer.deploy(TermLifeInsurance);
}; 