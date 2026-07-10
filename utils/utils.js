export function validCustomerid(obj){
    if (obj.customerId === undefined){
        return false
    }
    return true
}

export function validCartItems(obj){
    if (obj.customerId === undefined || obj.productId === undefined || obj.quantity === undefined){
        return false
    }
    if ( obj.quantity <= 0 || !(Number.isInteger(quantity))){
        return false
    }
    
}

export function ValidProduct(obj){
    if (obj.productId === undefined){
        return false
    }
    return true
}
