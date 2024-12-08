import { useState, useEffect } from "react";
import { getUsers } from "serverActions/getUsers";
import { signIn } from "auth";

type User = {
  username: any;
  _id: string;
  name: string;
  email: string;
  role: string;
  password: string;
  createdAt: Date;
};

const Alias = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  //using getUsers to fetch all the users and pushing it to resolvedArray
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const promise = getUsers();
        const users = await promise;
        resolvedArray.push(...users);

        if (resolvedArray.length > 0) {
            setLoading(false);
          }
      } catch (error) {
        console.error("error fetching user:", error);
      }
    };
    const resolvedArray: any[] = [];
    setUsers(resolvedArray);

    fetchData();
  }, []);
  //handles selecting the user using id
  const selectUser = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = event.target.value;
    const selectedUser = users.find((user) => user._id === selectedId);

    if(!selectedUser) return;

    try {
      if (selectedUser) {
        setUser(selectedUser || null);
        // signIn("credentials", selectedUser);
      }
    } catch (error) {
      console.error("Error Selecting the user: ", error);
    }

    console.log(selectedId);
  };

  
  return (
    <>
      {loading ? (
        <p>Loading users</p>
      ) : (
        <>
          <p>{user ? user.name : "yourself"}</p>
          <select onChange={selectUser} value={user?._id || ""}>
            {users.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
        </>
      )}
    </>
  );
};

export default Alias;
