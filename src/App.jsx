import { useState, useEffect, createContext, useContext, useMemo } from "react";
import {
  Space,
  Table,
  Tag,
  Checkbox,
  Form,
  Input,
  Modal,
  Button,
  DatePicker,
  Switch,
} from "antd";
import ReactQuill from "react-quill";
import TextEditor from "./components/TextEditor";
import icon from "./assets/img/tasks.svg";
import dayjs from "dayjs";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

import { HolderOutlined, SearchOutlined } from "@ant-design/icons";
import { DndContext } from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

const RowContext = createContext({});
const { RangePicker } = DatePicker;
const { Column } = Table;

const api = axios.create({
  baseURL: "http://localhost:8080/",
  timeout: 15000,
});

const DragHandle = () => {
  const { setActivatorNodeRef, listeners } = useContext(RowContext);
  return (
    <Button
      type="text"
      size="small"
      icon={<HolderOutlined />}
      style={{
        cursor: "move",
      }}
      ref={setActivatorNodeRef}
      {...listeners}
    />
  );
};

const Row = (props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: props["data-row-key"],
  });
  const style = {
    ...props.style,
    transform: CSS.Translate.toString(transform),
    transition,
    ...(isDragging
      ? {
          position: "relative",
          zIndex: 9999,
        }
      : {}),
  };
  const contextValue = useMemo(
    () => ({
      setActivatorNodeRef,
      listeners,
    }),
    [setActivatorNodeRef, listeners]
  );
  return (
    <RowContext.Provider value={contextValue}>
      <tr {...props} ref={setNodeRef} style={style} {...attributes} />
    </RowContext.Provider>
  );
};

const modules = {
  toolbar: [
    [{ header: "1" }, { header: "2" }, { font: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    ["bold", "italic", "underline"],
    [{ color: [] }, { background: [] }],
    ["link", "image", "video"],
    ["clean"],
  ],
};

function App() {
  const [tasks, setTasks] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [openConfirmModal, setOpenConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [formState, setFormState] = useState("create");
  const [searchQuery, setSearchQuery] = useState(""); // State for search query
  const notify = (text) => toast.success(text);
  const showModal = () => {
    setFormState("create");
    setIsModalOpen(true);
  };

  const handleOk = () => {
    form.submit();
    form
      .validateFields()
      .then(async (values) => {
        if (formState === "create") {
          createTask(values);
        }
        if (formState === "edit") {
          updateTask(values);
        }

        setTimeout(() => {
          getTask();
        }, 500);
      })
      .catch((errorInfo) => {
        console.log("err: ", errorInfo);
      });
  };

  async function getTask() {
    try {
      const result = (await api.get("api/tasks")).data;

      setTasks(result.data);
    } catch (error) {
      console.log(error);
      console.log(error.response?.data);
      console.log(error.message);
    } finally {
      console.log("done");
    }
  }

  async function createTask(values) {
    values["startDate"] = values?.dueDate[0];
    values["endDate"] = values?.dueDate[1];

    delete values.dueDate;

    console.log(values);

    try {
      const result = (await api.post("api/task", values)).data;

      setIsModalOpen(false);
      notify("Created Tasks Successful");
      form.resetFields();
      return result.data;
    } catch (error) {
      console.log(error);
      console.log(error.response?.data);
      console.log(error.message);
    } finally {
      console.log("done");
    }
  }

  async function updateTask(values) {
    values["startDate"] = values?.dueDate[0];
    values["endDate"] = values?.dueDate[1];

    delete values.dueDate;

    console.log(values);

    try {
      const result = (
        await api.put(`/api/tasks/detail/${selectedTasks.row_id}`, values)
      ).data;

      setIsModalOpen(false);
      notify("Updated Tasks Successful");

      return result.data;
    } catch (error) {
      console.log(error);
      console.log(error.response?.data);
      console.log(error.message);
    } finally {
      console.log("done");
    }
  }

  async function updateTaskStatus(id,status) {

    try {
      const result = (
        await api.put(`/api/tasks/status/${id}`, {status : status} )
      ).data;

      setIsModalOpen(false);
      if(status === 1){
        notify("Complete Tasks Successful");
      }
      if(status === 0){
        notify("Uncomplete Tasks Successful");
      }
      return result.data;
    } catch (error) {
      console.log(error);
      console.log(error.response?.data);
      console.log(error.message);
    } finally {
      console.log("done");
    }
  }


  async function handlerDelete(taskData) {
    setOpenConfirmModal(true);
    setSelectedTasks(taskData);
  }

  async function handlerUpdate(taskData) {
    setFormState("edit");
    setIsModalOpen(true);
    setSelectedTasks(taskData);
  }

  async function confirmDelete() {
    if (selectedTasks.row_id) {
      deleteTask(selectedTasks.row_id);
    }
  }

  async function deleteTask(id) {
    try {
      const result = (await api.delete(`api/tasks/${id}`)).data;
      setOpenConfirmModal(false);

      notify("Deleted Tasks Successful");
      getTask();
      return result.data;
    } catch (error) {
      console.log(error);
      console.log(error.response?.data);
      console.log(error.message);
    } finally {
      console.log("done");
    }
  }

  useEffect(() => {
    if (selectedTasks) {
      form.setFieldsValue({
        title: formState === "edit" ? selectedTasks.title : "",
        detail: formState === "edit" ? selectedTasks.detail : "",
        dueDate:
          selectedTasks.startdate &&
          selectedTasks.enddate &&
          formState === "edit"
            ? [dayjs(selectedTasks.startdate), dayjs(selectedTasks.enddate)]
            : [],
      });
    }
  }, [selectedTasks, form, formState]);

  useEffect(() => {
    getTask();
  }, []);

  const handleCancel = () => {
    setIsModalOpen(false);
    setOpenConfirmModal(false);
  };

  const onFinish = (values) => {
    console.log("Success:", values);
  };
  const onFinishFailed = (errorInfo) => {
    console.log("Failed:", errorInfo);
  };

  const onDragEnd = ({ active, over }) => {
    if (active.id !== over?.id) {
      setTasks((prevState) => {
        const activeIndex = prevState.findIndex(
          (record) => record.row_id === active?.id
        );
        const overIndex = prevState.findIndex(
          (record) => record.row_id === over?.id
        );
        return arrayMove(prevState, activeIndex, overIndex);
      });
    }
  };


  const filteredTasks = tasks.filter((task) =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onChange = (id,checked) => {
    updateTaskStatus(id, Number(checked))
  };


  return (
    <>
      <Toaster />
      <Modal
        className="top-10"
        title={<div className="capitalize">{formState} Task </div>}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            Cancel
          </Button>,
          <Button
            key="delete"
            type="warning"
            className="bg-blue-700 text-white"
            onClick={handleOk}
          >
            {formState.toUpperCase()}
          </Button>,
        ]}
      >
        <Form
          form={form}
          name="validateOnly"
          layout="vertical"
          autoComplete="off"
        >
          <Form.Item
            name="title"
            label="Title"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <Input placeholder="Aa" />
          </Form.Item>
          <Form.Item name="detail" label="Detail">
            <ReactQuill
              theme="snow"
              placeholder="Aa"
              modules={modules}
              className="h-[100px]"
            />
          </Form.Item>

          <Form.Item
            className="mt-[80px]"
            name="dueDate"
            label="Date"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <RangePicker showTime needConfirm={false} className="w-full" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={openConfirmModal}
        title="Delete task"
        onOk={confirmDelete}
        onCancel={handleCancel}
        footer={[
          <Button key="cancel" onClick={handleCancel}>
            Cancel
          </Button>,
          <Button
            key="delete"
            type="warning"
            className="bg-red-400 text-white"
            loading={loading}
            onClick={confirmDelete}
          >
            Delete
          </Button>,
        ]}
      >
        <span> Do you want to delete this task ?</span>
        <span className="underline underline-offset-4 text-red-400 p-2 ml-2 rounded-md">
          {selectedTasks?.title}
        </span>
      </Modal>

      <main className=" bg-white text-black w-full min-h-screen flex items-center justify-start flex-col gap-2">
        <header className="w-full flex items-center p-5 border-b">
          <ul>
            <li className="pointer-events-none select-none">Task Management</li>
          </ul>
        </header>

        <section className="content w-full px-[50px]">
          <div className="w-full flex items-center justify-center gap-3">
            <div className="w-[300px]">
              <img className="w-full h-full" src={icon} alt="" />
            </div>
            <button className=" text-white" onClick={showModal}>
              Create New Task
            </button>
          </div>

          {/* Search Bar */}
          <Input
            prefix={<SearchOutlined />}
            placeholder="Search tasks"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ marginBottom: 16 }}
          />

          <DndContext
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={onDragEnd}
          >
            <SortableContext
              items={filteredTasks.map((i) => i.row_id)}
              strategy={verticalListSortingStrategy}
            >
              <Table
                rowKey="row_id"
                components={{
                  body: {
                    row: Row,
                  },
                }}
                dataSource={filteredTasks}
              >
                <Column
                  align="center"
                  key="sort"
                  width="80"
                  render={() => <DragHandle />}
                />
                <Column title="Title" dataIndex="title" key="title" />

                <Column
                  title="Detail"
                  dataIndex="detail"
                  key="lastName"
                  render={(value, record) => (
                    <div dangerouslySetInnerHTML={{ __html: record.detail }} />
                  )}
                />
                <Column
                  title="Start Date"
                  dataIndex="startdate"
                  key="startdate"
                  render={(value) => (
                    <> {dayjs(value).format("YYYY-MM-DD HH:mm:ss")} </>
                  )}
                />
                <Column
                  title="End Date"
                  dataIndex="enddate"
                  key="enddate"
                  render={(value) => (
                    <> {dayjs(value).format("YYYY-MM-DD HH:mm:ss")} </>
                  )}
                />

                <Column
                  title="Action"
                  key="action"
                  render={(_, record) => (
                    <Space size="middle">
                      <a onClick={() => handlerUpdate(record)}>Edit</a>
                      <a onClick={() => handlerDelete(record)}>Delete</a>
                    </Space>
                  )}
                />

                <Column
                  title="Complete"
                  dataIndex="status"
                  key="status"
                  render={(value,record) => (
                    <Switch defaultChecked={value === 1} onChange={(checked) => onChange(record.row_id , checked)} />
                  )}
                />
              </Table>
            </SortableContext>
          </DndContext>
        </section>
      </main>
    </>
  );
}

export default App;

function SectionTitle({ title }) {
  return (
    <div className="border-l-8 border-black pl-2 w-full mt-3 "> {title} </div>
  );
}
