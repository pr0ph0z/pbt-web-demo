import abi from "../contract/abi.json";
import {
  TextInput,
  Button,
  Group,
  Text,
  Flex,
  ActionIcon,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { IconCheck, IconPlus, IconTrash, IconX } from "@tabler/icons-react";
import { ethers } from "ethers";
import Link from "next/link";
import { BaseError } from "viem";
import {
  useAccount,
  useContractWrite,
  usePrepareContractWrite,
  useWaitForTransaction,
} from "wagmi";

export default function Seed() {
  const { openConnectModal } = useConnectModal();
  const { isConnected } = useAccount();
  const form = useForm({
    initialValues: {
      chipAddresses: [{ chipAddress: "" }],
    },
  });

  const {
    config,
    error: prepareError,
    isError: isPrepareError,
  } = usePrepareContractWrite({
    address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
    abi,
    functionName: "seedChipAddresses",
    args: [
      form.values.chipAddresses.some(({ chipAddress }) =>
        ethers.isAddress(chipAddress)
      )
        ? form.values.chipAddresses.map(({ chipAddress }) => chipAddress)
        : [],
    ],
  });
  const { data, error, isError, reset, write: seed } = useContractWrite(config);

  const { isLoading, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  });

  function parseErrorMessage(error: BaseError): string | undefined {
    if (error.message.includes("User rejected the request")) {
      return "Operation cancelled";
    }
  }

  if (isPrepareError && prepareError instanceof BaseError) {
    const errorMessage = parseErrorMessage(prepareError);
    notifications.show({
      id: "error",
      color: "red",
      icon: <IconX />,
      title: "Error on seeding",
      message: errorMessage,
      autoClose: 2000,
      withCloseButton: true,
    });
  }

  if (isError && error instanceof BaseError) {
    const errorMessage = parseErrorMessage(error);
    notifications.show({
      id: "error",
      color: "red",
      icon: <IconX />,
      title: "Error on seeding",
      message: errorMessage,
      autoClose: 2000,
      withCloseButton: true,
    });
    reset();
  }

  if (isLoading) {
    notifications.show({
      id: "tx",
      loading: true,
      title: "Submitting transaction",
      message:
        "The inputted chip addresses soon will be updated in the contract storage",
      autoClose: false,
      withCloseButton: false,
    });
  }

  if (isSuccess) {
    notifications.update({
      id: "tx",
      color: "teal",
      title: "Transaction confirmed",
      message: (
        <>
          The inputted chip addresses are ready to mint. Check the transaction
          at
          <Link href={`https://sepolia.etherscan.io/tx/${data?.hash}`}>
            {" "}
            {`https://sepolia.etherscan.io/tx/${data?.hash}`}
          </Link>
        </>
      ),
      icon: <IconCheck size="1rem" />,
      autoClose: 2000,
    });
  }

  const fields = form.values.chipAddresses.map((_, index) => (
    <>
      <Flex key={index} direction={{ base: "row" }} align="center" wrap="wrap">
        <TextInput
          withAsterisk
          placeholder="0x"
          style={{ marginTop: "5px", width: "1200px" }}
          styles={{
            rightSection: {
              width: "64px",
              justifyContent: "end",
              marginRight: "5px",
            },
          }}
          rightSection={
            <>
              {form.values.chipAddresses.length - index === 1 && (
                <ActionIcon
                  color="blue"
                  onClick={() =>
                    form.insertListItem("chipAddresses", { chipAddress: "" })
                  }
                >
                  <IconPlus size={15} />
                </ActionIcon>
              )}
              {form.values.chipAddresses.length !== 1 && (
                <ActionIcon
                  color="red"
                  onClick={() => form.removeListItem("chipAddresses", index)}
                >
                  <IconTrash size={15} />
                </ActionIcon>
              )}
            </>
          }
          {...form.getInputProps(`chipAddresses.${index}.chipAddress`)}
        />
      </Flex>
    </>
  ));

  return (
    <>
      <Text fz="xl" fw={500} style={{ marginBottom: "15px" }}>
        Seed Chip Addresses
      </Text>
      <form>
        {fields}
        <Group position="right" mt="md">
          <Button
            disabled={form.values.chipAddresses.some(
              ({ chipAddress }) => !ethers.isAddress(chipAddress)
            )}
            loading={isLoading}
            color="blue"
            onClick={isConnected ? seed : openConnectModal}
          >
            Submit
          </Button>
        </Group>
      </form>
    </>
  );
}
