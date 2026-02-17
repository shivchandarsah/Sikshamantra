import { useContext } from "react";
import { MyContext } from "@/utils/context/myContext.jsx"; // named import

const useMyContext = () => {
  return useContext(MyContext);
};

export default useMyContext;
