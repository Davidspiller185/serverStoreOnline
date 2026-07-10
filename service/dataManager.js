import fs from "fs/promises"


export async function readProduct() {
    const productRead = fs.readFile("../db/product.json","utf-8")
    return JSON.parse(productRead)
}

export async function writeProduct(content) {
    const productWrite = fs.writeFile("../db/product.json",content)
}

export async function readCustomer() {
    const customerRead = fs.readFile("../db/Customer.json","utf-8")
    return JSON.parse(customerRead) 
}

export async function writeCustomer(content) {
    const customerWrite = fs.writeFile("../db/Customer.json",content)
}

export async function readOrder() {
    const orderRead = fs.readFile("../db/Order.json","utf-8")
    return JSON.parse(orderRead)
}