const { expect } = require("chai")

const NAME = "TokenMaster"
const SYMBOL = "TM"

const OCCASION_NAME = "TECH 2 TEK"
const OCCASION_COST = ethers.utils.parseUnits('1', 'ether')
const OCCASION_MAX_TICKETS = 100
const OCCASION_DATE = "Jul 07"
const OCCASION_TIME = "20:15 UTC"
const OCCASION_LOCATION = "Lille, France"

describe("TokenMaster", () => {
  let TokenMaster
  //Accounts
  let deployer, buyer

  //Before each test run this code
  beforeEach(async () => {
    //Setup accounts - pas compris getSigners
    [deployer, buyer] = await ethers.getSigners()

    //contracts folder
    const TokenMaster = await ethers.getContractFactory("TokenMaster")
    // Pas compris comment il sait que le compte qui deploy est deployer -> surement premier de la list getsigners
    tokenMaster = await TokenMaster.deploy(NAME, SYMBOL)

    //connect -> specify the account to use

    const transaction = await tokenMaster.connect(deployer).list(
      OCCASION_NAME,
      OCCASION_COST,
      OCCASION_MAX_TICKETS,
      OCCASION_DATE,
      OCCASION_TIME,
      OCCASION_LOCATION
    )

    //Wait for transaction to be completed before testing it
    await transaction.wait()
  })

  describe("Deployment", () => {

    it("Sets the name", async () => {
      let name = await tokenMaster.name()
      expect(name).to.equal(NAME)
    })

    it("Sets the symbol", async () => {
      let symbol = await tokenMaster.symbol()
      expect(symbol).to.equal(SYMBOL)
    })

    it("Sets the owner", async () => {
      expect(await tokenMaster.owner()).to.equal(deployer.address)
    })

  })

  describe("Occasions", () => {
    it("Updates occasions count", async () => {
      const totalOccasions = await tokenMaster.totalOccasions()
      expect(totalOccasions).to.be.equal(1)
    })

    it("Returns occasions attributes", async () => {
      const occasion = await tokenMaster.getOccasion(1)
      expect(occasion.id).to.be.equal(1)
      expect(occasion.name).to.be.equal(OCCASION_NAME)
      expect(occasion.cost).to.be.equal(OCCASION_COST)
      expect(occasion.tickets).to.be.equal(OCCASION_MAX_TICKETS)
      expect(occasion.date).to.be.equal(OCCASION_DATE)
      expect(occasion.time).to.be.equal(OCCASION_TIME)
      expect(occasion.location).to.be.equal(OCCASION_LOCATION)
    })
  })

  describe("Minting", () => {

    const ID = 1
    const seat = 50
    const amount = ethers.utils.parseUnits("1", "ether")

    beforeEach(async () => {
      //value is metadata of transaction
      const transaction = await tokenMaster.connect(buyer).mint(ID, seat, { value: amount })
      await transaction.wait()
    })

    it("Updates ticket count", async () => {
      const occasion = await tokenMaster.getOccasion(ID)
      //We can console.log
      console.log(expect(occasion.tickets).to.be.equal(OCCASION_MAX_TICKETS - 1))
    })

    it("Updates buying status", async () => {
      const status = await tokenMaster.hasBought(ID, buyer.address)
      expect(status).to.be.equal(true)
    })

    it("Updates seat status", async () => {
      const owner = await tokenMaster.seatTaken(ID, seat)
      expect(owner).to.be.equal(buyer.address)
    })

  })
})
