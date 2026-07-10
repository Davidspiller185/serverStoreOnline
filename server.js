import express from "express"
import dotenv from "dotenv/config"
import fs from 'fs/promises'
import { validCustomerid,validCartItems,ValidProduct } from "./utils/utils.js"
import { readProduct,readCustomer,writeCustomer,readOrder, readOrder,writeProduct } from "./service/dataManager.js"



const pathProduct = process.env.path_product
const Customerpath = process.env.path_Customer
const port = process.env.port
const server = express()

server.use(express.json())

server.get("/",(req,res) =>{
    res.json({message:"Welcom to store online api"})
})

server.get("/health",(req,res) =>{
    res.status(200).json({
        status: "ok"
    })
})

server.get("/products", async (req,res) =>{
    try{
    const {inStock,maxPrice,search} = req.query
    const dataProduct =  await readProduct()
    const FilterProduct = dataProduct.filter(product =>{
        if(inStock && product.stock === 0){
            return false
        }
        if (maxPrice && product.price > maxPrice){
            return false
        }
        if (search && !(product.name.includes(search))){
            return false
        }
        return true
    })
    if (FilterProduct.length > 0){
        res.status(200).json({"success":true,"data":{"products": FilterProduct}})
    } 
    else{
        res.status(404).json({"success":false,"message":"product not found"})
    }
    }
    catch(err){
        res.status(500).json({"success":false,"message":"internal server error"})


    }
})

server.get("/cart", async(req,res) => {
    try{
    const {customerId} = req.query
    if (!(validCustomerid(req.query))){
        return res.status(400).json({"success":false,"message":"must to send customerId"})
    }
    const dataCustomer = await readProduct()
    const FindCustomer = dataCustomer.find(customer =>customer.customerId === customerId)
    if (FindCustomer){
        res.status(200).json({"success":true,"data":{"customer cart": FindCustomer.cart}})
    }
    else{
        res.status(404).json({"success":false,"message":"CustomerId not found" })
    }
    
   }
   catch(err){
    res.status(500).json({"success":false,"message": "internal server error"})
   }
})


server.post("/cart/items", async(req,res) =>{
    try{
    const {customerId,productId,quantity} = req.body
    if(!(validCartItems(req.body))){
        return res.status(400).json({"success":false,"message":"must to send complete body"})
    }
    const dataProduct = await readProduct()
    const FindProduct = dataProduct.find(product => product.id === productId )
    if (!(FindProduct)){
        return res.status(404).json({"success":false,"message":"product id not found"})
    }
    if ( quantity > FindProduct.stock){
        return res.status(400).json({"success":false,"message":"we not have this quantity of this product"})
    }
    const dataCustomer = await readCustomer()
    const FindCostumer = dataCustomer.find(customer => customer.customerId === customerId)
    if (!(FindCostumer)){
        return res.status(404).json({"success":false,"message":"customer id not found"})
    }
    FindCostumer.cart.push(req.body)
    await writeCustomer(dataCustomer)
    res.status(201).json({"success":true,"data":{message:`created item in cart: ${req.body}`}})
    }
    catch(err){
        res.status(500).json({"success":false,"message":"internal server error"})
    }
})

server.delete("/cart/items/:productId",async(req,res) =>{
    try{
    const {customerId} =req.body
    const {productId} = req.params
    if(!(validCustomerid)){
        return res.status(400).json({"success":false,"message":"must to send customerId"})
    }
    if (!(ValidProduct(req.params))){
        return res.status(400).json({"success":false,"message":"must to send product id"})
    }
    const dataCustomer =  await readCustomer()
    const FindCostumer = dataCustomer.find(customer => customer.customerId === customerId)
    if (!(FindCostumer)){
        return res.status(404).json({"success":false,"message":"customer id not found"})
    }
    const dataProduct = await readProduct()
    const FindProduct = dataProduct.find(product => product.id === productId )
    if (!(FindProduct)){
        return res.status(404).json({"success":false,"message":"product id not found"})
    }
    const FindProductCart = FindCostumer.cart.find(item => item.productId === productId)
    if (!(FindProductCart)){
        return res.status(404).json({"success":false,"message":"product id not found in the cart"})
    }
    const FilterCart = FindCostumer.cart.filter(item => item.productId !== productId)
    await writeCustomer(dataCustomer)
    res.status(200).json({"success":true,"data":{"message":`delete item in cart with product id: ${productId}`}})
    }
    catch(err){
        res.status(500).json({"success":false,"message":"internal server error"})
    }
})

server.get("/account/balance", async (req,res) =>{
    try{
    const {customerId} = req.query
    if (!(validCustomerid(req.query))){
        return res.status(400).json({"success":false,"message":"must to send customerId"})
    }
    const dataCustomer =  await readCustomer()
    const FindCostumer = dataCustomer.find(customer => customer.customerId === customerId)
    if (!(FindCostumer)){
        return res.status(404).json({"success":false,"message":"customer id not found"})
    }
    res.status(200).json({"success":true,"data":{"current balance":FindCostumer.balance}})
    }
    catch(err){
        res.status(500).json({"success":false,"message":"internal server error"})
    }

})

server.post("/orders/checkout",async(req,res) =>{
    try{
    const {customerId} =req.body
    if(!(validCustomerid)){
        return res.status(400).json({"success":false,"message":"must to send customerId"})
    }
    const dataCustomer =  await readCustomer()
    const FindCostumer = dataCustomer.find(customer => customer.customerId === customerId)
    if (!(FindCostumer)){
        return res.status(404).json({"success":false,"message":"customer id not found"})
    }
    const dataProduct = await readProduct()
    if (FindCostumer.cart.length === 0){
        return res.status(400).json({"success":false,"message":"the cart is empty can not make order"})
    }
    const filterBigQuantity = FindCostumer.cart.filter(item =>{
            const FindProduct = dataProduct.find(product => product.id === item.productId )
            return item.quantity > FindProduct.stock
    })
    if (filterBigQuantity.length > 0){
        const mapBigQuantity = filterBigQuantity.map(big => ({productId:big.productId,quantity:big.quantity}) )
        return res.status(400).json({"success":false,"message":`we have not stock for product id:${mapBigQuantity}`})
    }
    const dataOrder = await readOrder()
    const id = Math.max(0,...dataOrder.map(order => order.id)) + 1
    const items = FindCostumer.cart.map(item => {
        const FindProduct = dataProduct.find(product => product.id === item.productId)
        const price = FindProduct.price * item.quantity
        return {...item,price}
    })
    const total = items.reduce((acc,current) => acc + current.price,items[0].price)
    if (FindCostumer.balance < total){
        return res.status(400).json({"success":false,"message":"you don't have money for pay the order"})
    }
    const createdAt = new Date()
    dataOrder.push({id,customerId,items,total,createdAt})
    FindCostumer.cart.forEach(item =>{
        const FindProduct = dataProduct.find(product => product.id === item.productId)
        FindProduct.stock -= item.quantity
    })
    await writeProduct(dataProduct)
    FindCostumer.balance -= total
    await writeCustomer(dataCustomer)
    }
    catch(err){
        res.status(500).json({"success":false,"message":"internal server error"})
    }
})

server.get("/orders", async(req,res) =>{
    try{
    const {customerId} = req.query
    if (!(validCustomerid(req.query))){
        return res.status(400).json({"success":false,"message":"must to send customerId"})
    }
    const dataCustomer = await readProduct()
    const FindCustomer = dataCustomer.find(customer =>customer.customerId === customerId)
    if (!(FindCustomer)){
        return res.status(404).json({"success":false,"message":"customer id not found"})
    }
    const dataOrder = await readOrder()
    const orderHistory = dataOrder.filter(order => order.customerId === customerId)
    if (orderHistory.length === 0){
        return res.status(404).json({"success":false,"message":"not found any order for this customer id"})
    }
    res.status(200).json({"success":true,"data":{"order History":orderHistory}})
    }
    catch(err){
        res.status(500).json({"success":false,"message":"internal server error"})
    }
})

server.use((req,res) =>{
    res.status(404).json({"success":false,"message":"router not found"})
})

server.listen(port,() => console.log(`server listen on port ${port}`))




