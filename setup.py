from setuptools import setup, find_namespace_packages
from setup_helper import find_all_resource_files

# -- Apps Definition -- #
namespace = 'tethysapp'
app_package = "ggst"
release_package = "tethysapp-" + app_package

# -- Python Dependencies -- #
dependencies = []

# -- Get Resource File -- #
resource_files = find_all_resource_files(app_package, namespace)
    "tethysapp/" + app_package + "/templates", "tethysapp/" + app_package
)

    "tethysapp/" + app_package + "/public", "tethysapp/" + app_package
)

    "tethysapp/" + app_package + "/workspaces", "tethysapp/" + app_package
)


setup(
    name=release_package,
    version="0.0.1",
    description="Visualize and subset Grace data",
    long_description="",
    keywords="",
    author="Sarva Pulla",
    author_email="pulla@byu.edu",
    url="",
    license="MIT",
    packages=find_namespace_packages(),
    package_data={"": resource_files},
    include_package_data=True,
    zip_safe=False,
    install_requires=dependencies,
)
