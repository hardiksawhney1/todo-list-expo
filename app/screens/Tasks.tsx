import React, { useContext, useEffect, useState, useCallback } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  TextInput,
  Modal,
  Button,
} from "react-native";
import { useUserStore } from "../../stores/UserStoreContext";
import { Image } from "expo-image";
import { addIcon, checkIcon, deleteIcon } from "../../assets"; // Import delete icon
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  deleteDoc,
  getDoc,
  DocumentData,
  orderBy,
  updateDoc,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { TaskRefreshContext } from "../../stores/TaskRefreshContext";
import { useSearchBool } from "../../stores/SearchContext";

interface Task {
  taskId: string;
  taskName: string;
  category: string;
  date: string; // Assuming date is stored as Timestamp in Firestore
  dueDate: string; // New field for due date in DD/MM/YYYY format
  completed: boolean;
  tagRefIds: string[]; // Assuming this is the array of tag document ids
  tagNames: string[]; // Array to store tag names
}

const Tasks: React.FC = () => {
  const userStore = useUserStore();
  const { user } = userStore;
  const router = useRouter();
  const { search, contentArray, setContentArray } = useSearchBool();
  const [tasks, setTasks] = useState<Task[]>([]);
  const { refreshTasks, setRefreshTasks } = useContext(TaskRefreshContext);
  const customHeaderHeight = 130; // Adjust this to your custom header's height
  const [isLoading, setIsLoading] = useState<boolean>(false);
  //   const [contentArray, setContentArray] = useState<Task[]>([]);
  const [searchVal, setSearchVal] = useState("");
  const [term, setTerm] = useState("");
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  useEffect(() => {
    setContentArray(tasks);
  }, [tasks]);

  const completed = useCallback(() => {
    const completedTasks = tasks.filter((task) => task.completed);
    setContentArray(completedTasks);
    setTerm("c");
  }, [tasks]);

  const pending = useCallback(() => {
    const pendingTasks = tasks.filter((task) => !task.completed);
    setContentArray(pendingTasks);
    setTerm("p");
  }, [tasks]);

  const all = useCallback(() => {
    setContentArray(tasks);
    setTerm("");
  }, [tasks]);

  const fetchTasks = useCallback(async () => {
    if (user) {
      try {
        setIsLoading(true);

        const tasksCollection = collection(db, "tasks");
        const q = query(
          tasksCollection,
          where("uid", "==", user.uid),
          orderBy("date", "desc")
        );

        const querySnapshot = await getDocs(q);
        const tasksData: Task[] = [];

        const statusCollection = collection(db, "status");
        const statusSnapshot = await getDocs(statusCollection);
        const statusMap: Record<string, boolean> = {};
        statusSnapshot.forEach((doc) => {
          const data = doc.data();
          statusMap[data.taskId] = data.taskCompleted;
        });

        for (const docRef of querySnapshot.docs) {
          const taskData = docRef.data() as DocumentData;
          const categoryId = taskData.categoryRefId;
          const categoryDoc = doc(db, "category", categoryId);
          const categorySnap = await getDoc(categoryDoc);
          const categoryData = categorySnap.data();
          const categoryName = categoryData
            ? categoryData.taskCategory
            : "Unknown";

          const completed = statusMap[docRef.id] ?? false;

          const tagRefIds: string[] = taskData.tagRefIds ?? [];
          const tagNames: string[] = [];

          for (const tagId of tagRefIds) {
            const tagDoc = doc(db, "tags", tagId);
            const tagSnap = await getDoc(tagDoc);
            if (tagSnap.exists()) {
              const tagData = tagSnap.data();
              if (tagData) {
                tagNames.push(tagData.tagName);
              }
            }
          }

          const dueDate = taskData.dueDate ? new Date(taskData.dueDate) : null;
          const formattedDueDate = dueDate
            ? `${dueDate.getDate()}/${
                dueDate.getMonth() + 1
              }/${dueDate.getFullYear()}`
            : "";

          tasksData.push({
            taskId: docRef.id,
            taskName: taskData.taskName,
            category: categoryName,
            date: taskData.date,
            dueDate: formattedDueDate,
            completed: completed,
            tagRefIds: tagRefIds,
            tagNames: tagNames,
          });
        }

        setTasks(tasksData);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [user]);

  useEffect(() => {
    fetchTasks();
  }, [user, fetchTasks]);

const addNewTask = async (newTask: Omit<Task, 'taskId'>) => {
  try {
    const taskRef = await addDoc(collection(db, "tasks"), {
      uid: user?.uid,
      taskName: newTask.taskName,
      categoryRefId: newTask.category,
      date: Timestamp.fromDate(new Date()),
      dueDate: newTask.dueDate,
      tagRefIds: newTask.tagRefIds,
    });

    await addDoc(collection(db, "status"), {
      taskId: taskRef.id,
      taskCompleted: newTask.completed,
    });

    const taskWithId = {
      ...newTask,
      taskId: taskRef.id,
    };

    setTasks((prevTasks) => [taskWithId, ...prevTasks]);

    console.log("Task successfully added!");
  } catch (error) {
    console.error("Error adding new task:", error);
  }
};


  const openAddTaskModal = () => {
    router.push("modal");
  };

  const toggleTaskCompletion = async (taskId: string, completed: boolean) => {
    try {
      const statusCollection = collection(db, "status");
      const q = query(statusCollection, where("taskId", "==", taskId));
      const querySnapshot = await getDocs(q);

      setTasks((prevTasks:any) =>
        prevTasks.map((task:any) =>
          task.taskId === taskId
            ? { ...task, completed: !task.completed }
            : task
        )
      );


      if (!querySnapshot.empty) {
        const docSnapshot = querySnapshot.docs[0];
        const statusRef = doc(db, "status", docSnapshot.id);
        await updateDoc(statusRef, {
          taskCompleted: completed,
        });
      } else {
        console.log(`No document found with taskId ${taskId}`);
      }
    } catch (error) {
      console.error("Error updating task completion:", error);
    }
  };

  const deleteTask = async (task: Task) => {
    setTasks((prevTasks) => prevTasks.filter((t) => t.taskId !== task.taskId));
    setContentArray((prevContent:any) =>
      prevContent.filter((t:any) => t.taskId !== task.taskId)
    );

    try {
      await deleteDoc(doc(db, "tasks", task.taskId));

      const statusCollection = collection(db, "status");
      const q = query(statusCollection, where("taskId", "==", task.taskId));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const docSnapshot = querySnapshot.docs[0];
        await deleteDoc(doc(db, "status", docSnapshot.id));
      }
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const confirmDeleteTask = (task: Task) => {
    setTaskToDelete(task);
    setIsModalVisible(true);
  };

  const handleDeleteConfirm = () => {
    if (taskToDelete) {
      deleteTask(taskToDelete);
    }
    setIsModalVisible(false);
    setTaskToDelete(null);
  };

  const handleDeleteCancel = () => {
    setIsModalVisible(false);
    setTaskToDelete(null);
  };

  const renderTaskItem = ({ item }: { item: Task }) => (
    <Pressable
      style={[
        styles.taskContainer,
        { backgroundColor: item.completed ? "#e5ffe5" : "#f0f0f0" },
        {borderColor: item.completed ? "#e5ffe5" : "rgba(82, 100, 204, 1)"},
      ]}
      onPress={() => console.log("Task pressed:", item.taskName)}
    >
      <View style={styles.taskInfo}>
        <Text style={styles.taskName}>{item.taskName}</Text>
        <Text style={styles.taskCategory}>Category: {item.category}</Text>
        <Text style={styles.taskCategory}>
          Tags: {item.tagNames.map((tag) => `#${tag}`).join(", ")}
        </Text>
        <Text style={styles.taskCategory}>Due Date: {item.dueDate}</Text>
      </View>
      <View style={styles.taskActions}>
        <Pressable
          style={[
            styles.checkbox,
            { backgroundColor: item.completed ? "#4CAF50" : "#f0f0f0" },
            {borderColor: item.completed ? "#e5ffe5" : "rgba(82, 100, 204, 1)"}
          ]}
          onPress={() => toggleTaskCompletion(item.taskId, !item.completed)}
        >
          {item.completed && (
            <Image
              source={checkIcon}
              style={styles.checkIcon}
              contentFit="contain"
            />
          )}
        </Pressable>
        <Pressable
          style={styles.deleteIconBox}
          onPress={() => confirmDeleteTask(item)}
        >
          <Image
            source={deleteIcon} // Ensure you have a delete icon in your assets
            style={styles.deleteIcon}
            contentFit="contain"
          />
        </Pressable>
      </View>
    </Pressable>
  );

  useEffect(() => {
    const lowerCaseSearchTerm = searchVal.toLowerCase();

    const newFilteredTasks = tasks.filter((task) => {
      const matchesName = task.taskName
        .toLowerCase()
        .includes(lowerCaseSearchTerm);
      const matchesCategory = task.category
        .toLowerCase()
        .includes(lowerCaseSearchTerm);
      const matchesTags = task.tagNames.some((tag) =>
        tag.toLowerCase().includes(lowerCaseSearchTerm)
      );
      const matchesDueDate = task.dueDate
        .toLowerCase()
        .includes(lowerCaseSearchTerm);

      if (term === "c") {
        return (
          task.completed &&
          (matchesName || matchesCategory || matchesTags || matchesDueDate)
        );
      } else if (term === "p") {
        return (
          !task.completed &&
          (matchesName || matchesCategory || matchesTags || matchesDueDate)
        );
      } else {
        return matchesName || matchesCategory || matchesTags || matchesDueDate;
      }
    });

    setContentArray(newFilteredTasks);
  }, [searchVal, tasks, term]);

  return (
    <View style={styles.container}>
      {search ? (
        <TextInput
          onChangeText={(e) => setSearchVal(e)}
          style={styles.searchBar}
          placeholder="Search tasks..."
        />
      ) : null}
      <StatusBar style="light" />
      <View style={{ height: customHeaderHeight }} />

      {isLoading ? (
        <ActivityIndicator
          size="large"
          color="#0000ff"
          style={styles.activityIndicator}
        />
      ) : (
        <FlatList
          data={contentArray}
          renderItem={renderTaskItem}
          keyExtractor={(item, index) => item.taskId + index}
          contentContainerStyle={styles.taskList}
          ListHeaderComponent={
            <View
              style={[
                styles.filterButtons,
                search && styles.filterButtonsWithSearch,
              ]}
            >
              <Pressable
                onPress={all}
                style={[
                  styles.filterButton,
                  term === "" && styles.activeFilterButton,
                ]}
              >
                <Text
                  style={[
                    styles.buttonText,
                    term === "" && styles.activeButtonText,
                  ]}
                >
                  All
                </Text>
              </Pressable>
              <Pressable
                onPress={completed}
                style={[
                  styles.filterButton,
                  term === "c" && styles.activeFilterButton,
                ]}
              >
                <Text
                  style={[
                    styles.buttonText,
                    term === "c" && styles.activeButtonText,
                  ]}
                >
                  Completed
                </Text>
              </Pressable>
              <Pressable
                onPress={pending}
                style={[
                  styles.filterButton,
                  term === "p" && styles.activeFilterButton,
                ]}
              >
                <Text
                  style={[
                    styles.buttonText,
                    term === "p" && styles.activeButtonText,
                  ]}
                >
                  Pending
                </Text>
              </Pressable>
            </View>
          }
        />
      )}

      <Pressable
        onPress={openAddTaskModal}
        style={[
          styles.addIconBox,
          {
            backgroundColor: "rgba(82, 100, 204, 1)", // Adjust as needed
          },
        ]}
      >
        <Image
          source={addIcon}
          alt="addIcon"
          style={styles.addIcon}
          contentFit="contain"
        />
      </Pressable>

      <Modal visible={isModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text>Are you sure you want to delete this task?</Text>
            <View style={styles.modalButtons}>
              <Button title="Cancel" onPress={handleDeleteCancel} />
              <Button title="Yes" onPress={handleDeleteConfirm} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff", // Adjust as needed
  },
  taskList: {
    padding: 20,
  },
  taskContainer: {
    backgroundColor: "#f0f0f0",
    borderColor:'rgba(82, 100, 204, 1)',
    borderWidth:1,
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  taskInfo: {
    flex: 1,
  },
  taskName: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 5,
  },
  taskCategory: {
    fontSize: 14,
    color: "#666",
  },
  checkbox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    // borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
    borderColor:'rgba(82, 100, 204, 1)',
  },
  checkIcon: {
    width: 20,
    height: 20,
  },
  deleteIconBox: {
    width: 30,
    height: 30,
    marginLeft: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteIcon: {
    width: 20,
    height: 20,
  },
  taskActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  addIconBox: {
    height: 60,
    width: 60,
    position: "absolute",
    bottom: 50,
    right: 40,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  addIcon: {
    height: 30,
    width: 30,
  },
  activityIndicator: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -20, // Adjust according to activity indicator size
    marginLeft: -20, // Adjust according to activity indicator size
  },
  searchBar: {
    position: "absolute",
    top: 150,
    left: 10,
    right: 10,
    zIndex: 50,
    padding: 10,
    borderRadius: 5,
    backgroundColor: "#fff",
    borderColor: "#ccc",
    borderWidth: 1,
  },
  filterButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 10,
  },
  filterButtonsWithSearch: {
    marginTop: 60, // Adjust as necessary to make space for the search bar
  },
  filterButton: {
    width: "33%",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  activeFilterButton: {
    backgroundColor: `rgba(82, 100, 204, 1)`,
  },
  buttonText: {
    color: "#000", // Default text color of filter buttons
    fontWeight: "bold",
    textAlign: "center",
  },
  activeButtonText: {
    color: "#fff", // Text color of active filter button
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    alignItems: "center",
  },
  modalButtons: {
    flexDirection: "row",
    marginTop: 20,
    justifyContent: "space-between",
    width: "100%",
  },
});

export default Tasks;
