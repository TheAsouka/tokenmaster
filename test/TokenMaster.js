const { expect } = require("chai")
const { ethers } = require("hardhat")

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
    const SEAT = 50
    const AMOUNT = ethers.utils.parseUnits("1", "ether")

    beforeEach(async () => {
      //value is metadata of transaction
      //This transaction is a buyer minting a ticket and grab a seat
      const transaction = await tokenMaster.connect(buyer).mint(ID, SEAT, { value: AMOUNT })
      await transaction.wait()
    })

    it("Updates ticket count", async () => {
      const occasion = await tokenMaster.getOccasion(ID)
      //We can console.log
      console.log(expect(occasion.tickets).to.equal(OCCASION_MAX_TICKETS - 1))
    })

    it("Updates buying status", async () => {
      const status = await tokenMaster.hasBought(ID, buyer.address)
      expect(status).to.equal(true)
    })

    it("Updates seat status", async () => {
      const owner = await tokenMaster.seatTaken(ID, SEAT)
      expect(owner).to.equal(buyer.address)
    })

    it("Updates overall seating status", async () => {
      const seats = await tokenMaster.getSeatsTaken(ID)
      expect(seats.length).to.equal(1)
      expect(seats[0]).to.equal(SEAT)
    })

    it("Updated the contract balance", async () => {
      const balance = await ethers.provider.getBalance(tokenMaster.address)
      expect(balance).to.equal(AMOUNT)
    })

    //extra exercice
    it("Check is ID of occasion is not 0", async () => {
      const id = await tokenMaster.getOccasion(ID)
      expect(id).to.not.equal(0)
    })

  })

  describe("Withdrawing", () => {
    const ID = 1
    const SEAT = 50
    const AMOUNT = ethers.utils.parseUnits("1", "ether")
    let balanceBefore

    beforeEach(async () => {
      balanceBefore = await ethers.provider.getBalance(deployer.address)

      let transaction = await tokenMaster.connect(buyer).mint(ID, SEAT, { value: AMOUNT })
      await transaction.wait()

      transaction = await tokenMaster.connect(deployer).withdraw()
    })

    it("Updates the owner balance", async () => {
      const balanceAfter = await ethers.provider.getBalance(deployer.address)
      expect(balanceAfter).to.greaterThan(balanceBefore)
    })

    it("Updates the contract balance", async () => {
      const balance = await ethers.provider.getBalance(tokenMaster.address)
      expect(balance).to.equal(0)
    })
  })
})
