// const { changeColumnValue, getConnectedBoardName } = require("../Services/mondayService");

// const migrationController=async (req, res) => {
//   try {
//     const ItemName = await getConnectedBoardName(
//       req.body.payload.inputFields.itemId,
//       "board_relation_mkvt51gm"
//     );
//     console.log(ItemName, "itemm");
//     const res = await changeColumnValue(
//       req.body.payload.inputFields.boardId,
//       req.body.payload.inputFields.itemId, 
//       "name", 
//       ItemName
//     );
//   } catch (err) {
//     console.log(err);
//   }
//   res.send("ok");
// }

// module.exports={
//     migrationController
// }