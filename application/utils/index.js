import { FIRMWARES } from "../constants/firmware"


export const getFirmware = (id) => {
    return "/firmwares/" + FIRMWARES.find(firmware => firmware.id === id).default_firmware
}

export const getKeyboard = (id) => {
    return FIRMWARES.find(firmware => firmware.id === id)
}