

const getAllPlants = async () => {
    let query = "Select * from plantsInfo";
    let queryResult = query.run();
    return queryResult.rows();
}